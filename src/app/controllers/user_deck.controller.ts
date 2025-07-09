import { Context, Get, HttpResponseOK } from '@foal/core';

export class User_deckController {

  @Get('/')
  foo(ctx: Context) {
    return new HttpResponseOK();
  }

}
