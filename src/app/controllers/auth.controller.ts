import { Context, hashPassword, HttpResponseNoContent, HttpResponseOK, HttpResponseUnauthorized, Post, ValidateBody, verifyPassword } from '@foal/core';
import { User } from '../entities/index';

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
    const email = ctx.request.body.email;
    const password = ctx.request.body.password;

    const user = await User.findOneBy({ email });
    if (!user) {
      return new HttpResponseUnauthorized();
    }

    if (!(await verifyPassword(password, user.password))) {
      return new HttpResponseUnauthorized();
    }

    ctx.session!.setUser(user);
    ctx.user = user;

    return new HttpResponseOK({
      id: user.id,
      name: user.name,
    });
  }

  @Post('/logout')
  async logout(ctx: Context) {
    await ctx.session!.destroy();
    return new HttpResponseNoContent();
  }

  @Post('/signup')
  @ValidateBody(signUpSchema)
  async signup(ctx: Context) {
  
    const name = ctx.request.body.name;
    const email = ctx.request.body.email;
    const password = ctx.request.body.password;

    let user = new User();
    user.email = email;
    user.name = name;
    user.password = await hashPassword(password);

    user = await user.save();

    ctx.session!.setUser(user);
    ctx.user = user;

    return new HttpResponseOK({
      id: user.id,
      name: user.name,
    });
  }

}
