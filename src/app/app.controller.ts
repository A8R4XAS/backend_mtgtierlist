import { controller, Get, HttpResponseOK, IAppController, UseSessions } from '@foal/core';

import { ApiController } from './controllers';
import { TypeORMStore } from '@foal/typeorm';

@UseSessions({
  cookie: true,
  store: TypeORMStore,
  csrf: false,
})

export class AppController implements IAppController {
  subControllers = [
    controller('/api', ApiController),
  ];

  @Get('/ping')
  index() {
    return new HttpResponseOK('Welcome to the MTG Tier List API!');
  }
}
