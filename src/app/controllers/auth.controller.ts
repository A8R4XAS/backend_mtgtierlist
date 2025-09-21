import { Context, hashPassword, HttpResponseConflict, HttpResponseNoContent, HttpResponseOK, HttpResponseUnauthorized, Post, UseSessions, ValidateBody, verifyPassword, Get } from '@foal/core';
import { User, UserRole } from '../entities/index';

const credentialsSchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email', maxLength: 255 },
    password: { type: 'string' }
  },
  required: [ 'email', 'password' ],
  additionalProperties: false,
};

const signUpSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', maxLength: 255 },
    email: { type: 'string', format: 'email', maxLength: 255 },
    password: { type: 'string' }
  },
  required: ['name','email','password'],
  additionalProperties: false,
};

export class AuthController {

  @Post('/login')
  @ValidateBody(credentialsSchema)
  async login(ctx: Context) {

    const {email, password} = ctx.request.body;

    const user = await User.findOneBy({ email });
    if (!user) {
      return new HttpResponseUnauthorized('Bad credentials.');
    }

    if (!(await verifyPassword(password, user.password))) {
      return new HttpResponseUnauthorized();
    }

    ctx.session!.setUser(user);
    await ctx.session!.regenerateID();

    ctx.user = user;

    return new HttpResponseOK({
      id: user.id,
      name: user.name,
      role: user.role,
    });
  }

  @Post('/logout')
  @UseSessions()
  async logout(ctx: Context) {
    if (ctx.session) await ctx.session.destroy();
    return new HttpResponseNoContent();
  }

  @Post('/signup')
  @ValidateBody(signUpSchema)
  async signup(ctx: Context) {
  
    const {name, email, password} = ctx.request.body;

    const existingUser = await User.findBy({ email });
    if (existingUser.length > 0) {
      return new HttpResponseConflict({'error': 'Invalid signup request.'});
    }

    const user = new User();
    user.email = email;
    user.name = name;
    user.password = await hashPassword(password);
    // Bei der Registrierung wird standardmäßig die Rolle USER vergeben
    user.role = UserRole.USER;
    await user.save();

    ctx.session!.setUser(user);
    await ctx.session!.regenerateID();

    return new HttpResponseOK({});
  }

  @Get('/validate-role')
  async validateRole(ctx: Context) {
    // Überprüfe, ob der Benutzer eingeloggt ist
    if (!ctx.user) {
      return new HttpResponseUnauthorized();
    }

    // Hole den aktuellen Benutzer aus der Datenbank
    const user = await User.findOne({
      where: { id: ctx.user.id },
      select: ['role'] // Nur die Rolle wird benötigt
    });

    if (!user) {
      return new HttpResponseUnauthorized();
    }

    // Gib die Rolle zurück
    return new HttpResponseOK({ role: user.role });
  }

}
