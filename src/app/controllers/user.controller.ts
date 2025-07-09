import { Context, Get, HttpResponseOK } from '@foal/core';

export class UserController {

  @Get('/')
  foo(ctx: Context) {
    return new HttpResponseOK();
  }

}
