import { Context, Get, HttpResponseOK } from '@foal/core';

export class DeckController {

  @Get('/')
  foo(ctx: Context) {
    return new HttpResponseOK();
  }

}
