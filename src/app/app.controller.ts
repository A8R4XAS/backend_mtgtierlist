import { controller, dependency, Get, HttpResponseOK, IAppController, Store } from '@foal/core';

import { ApiController, AuthController, BackupController } from './controllers';

export class AppController implements IAppController {

  @dependency
  store: Store;

  subControllers = [
    controller('/api/auth', AuthController), // JWT-basiert, keine Session
    controller('/api', ApiController),       // JWT-basiert mit Middleware
    controller('/api/backup', BackupController),
  ];

  @Get('/ping')
  index() {
    return new HttpResponseOK('Welcome to the MTG Tier List API!');
  }
}
