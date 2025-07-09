import { Context, Get, HttpResponseOK } from '@foal/core';

export class AuthController {

  @Get('/')
  foo(ctx: Context) {
    return new HttpResponseOK();
  }

}
