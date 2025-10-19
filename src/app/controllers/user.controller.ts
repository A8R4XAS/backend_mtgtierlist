import { Context, Delete, Get, HttpResponseBadRequest, HttpResponseCreated, HttpResponseNoContent, HttpResponseNotFound, HttpResponseOK, Post, Put, ValidateBody, ValidatePathParam } from '@foal/core';
import { User } from '../entities/index';

export class UserController {

  @Get('/')
  async getUsers() {
    const users = await User.find();
    return new HttpResponseOK(users);
  }

  
  @Post('/')
  @ValidateBody({
    type: 'object',
    properties: {
      username: { type: 'string', maxLength: 255 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', maxLength: 255 }
    },
    required: ['username', 'email', 'password'],
    additionalProperties: false,
  })
  async postUser(ctx: Context) {
    const user = new User();

    user.name = ctx.request.body.name;
    user.email = ctx.request.body.email;
    user.password = ctx.request.body.password;

    await user.save();

    return new HttpResponseCreated(user);
  }



  @Delete('/:id')
  @ValidatePathParam('id', { type: 'number' })
  async deleteUser(ctx: Context) {
    const user = await User.findOneBy({ id: ctx.request.params.id });
    if (!user) return new HttpResponseNotFound();

    await user.remove();

    return new HttpResponseNoContent();
  }



  @Get('/:id')
  async getUser(ctx: Context) {
    const user = await User.findOneBy({ id: ctx.request.params.id });
    if (!user) return new HttpResponseNotFound('No such user');

    return new HttpResponseOK({'id' : user.id, 'name': user.name, 'email': user.email});
  }

  @Put('/:id')
  @ValidatePathParam('id', { type: 'number' })
  @ValidateBody({
    type: 'object',
    properties: {
      username: { type: 'string', maxLength: 255 },
      email: { type: 'string', format: 'email' }
    },
    additionalProperties: false,
  })
  async updateUser(ctx: Context) {
    try {
      const user = await User.findOneByOrFail({ id: ctx.request.params.id });
      
      if (ctx.request.body.username) {
        user.name = ctx.request.body.username;
      }
      
      if (ctx.request.body.email) {
        user.email = ctx.request.body.email;
      }

      await user.save();

      return new HttpResponseOK(user);
    } catch (error) {
      return new HttpResponseBadRequest(error);
    }
  }

  @Put('/:id/role')
  @ValidatePathParam('id', { type: 'number' })
  @ValidateBody({
    type: 'object',
    properties: {
      role: { type: 'string', enum: ['user', 'admin'] }
    },
    required: ['role'],
    additionalProperties: false,
  })
  async updateUserRole(ctx: Context) {
    try {
      const user = await User.findOneByOrFail({ id: ctx.request.params.id });
      user.role = ctx.request.body.role;
      await user.save();

      return new HttpResponseOK(user);
    } catch (error) {
      return new HttpResponseBadRequest(error);
    }
  }

  

  @Get('/name/:name')
  async getUsersByName(ctx: Context) {
    const users = await User.find({ where: { name: ctx.request.params.name } });
    return new HttpResponseOK(users);
  }

}
