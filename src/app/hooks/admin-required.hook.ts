import { Context, HookDecorator, HttpResponseForbidden } from '@foal/core';
import { User, UserRole } from '../entities/user.entity';

/**
 * Hook to check if the current user has admin privileges.
 * This hook should be used in combination with @UserRequired() 
 * as it assumes that ctx.user is already available.
 */
export function AdminRequired(): HookDecorator {
  return (ctx: Context) => {
    if (!ctx.user) {
      // This should not happen if @UserRequired() is used,
      // but we handle it as a safety measure
      return new HttpResponseForbidden('Authentication required.');
    }

    const user = ctx.user as User;
    if (user.role !== UserRole.ADMIN) {
      return new HttpResponseForbidden('Admin privileges required.');
    }

    // User is admin, allow access
    return;
  };
}