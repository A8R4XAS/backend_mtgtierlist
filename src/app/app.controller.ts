import { controller, dependency, Get, HttpResponseOK, IAppController, Store, UseSessions } from '@foal/core';

import { ApiController, AuthController, BackupController } from './controllers';
import { User } from './entities';

@UseSessions({
  cookie: true,
  csrf: false,
  redirectTo: '/login',
  user: (id: number) => User.findOneBy({ id }),
})

export class AppController implements IAppController {

  @dependency
  store: Store;

  subControllers = [
    controller('/api/auth', AuthController), // ⬅️ direkt hier
    controller('/api', ApiController),       // ⬅️ enthält @UserRequired()
    controller('/api/backup', BackupController),
  ];

  @Get('/ping')
  index() {
    return new HttpResponseOK('Welcome to the MTG Tier List API!');
  }
}
