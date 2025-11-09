import { Context, Hook, HookDecorator, HttpResponseForbidden } from '@foal/core';

/**
 * Hook to check if the current user has admin privileges.
 * IMPORTANT: This hook must be used together with @JWTRequired()
 * Usage: 
 *   @JWTRequired()
 *   @AdminRequired()
 *   @Get('/admin/users')
 */
export function AdminRequired(): HookDecorator {
  return Hook((ctx: Context) => {
    // ctx.user wurde bereits von @JWTRequired() gesetzt und validiert
    if (!ctx.user) {
      return new HttpResponseForbidden('Authentication required.');
    }

    // Admin-Rolle prüfen
    if (ctx.user.role !== 'ADMIN') {
      return new HttpResponseForbidden('Admin privileges required.');
    }

    // User ist Admin, Zugriff erlauben
    return;
  });
}