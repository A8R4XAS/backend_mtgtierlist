import { controller, dependency, Get, HttpResponseOK, IAppController, Store, UseSessions } from '@foal/core';

import { ApiController, AuthController } from './controllers';
import { User } from './entities';

@UseSessions({
  csrf: false,
  user: (id: number) => User.findOneBy({ id }),
})

export class AppController implements IAppController {

  @dependency
  store: Store;

  subControllers = [
    controller('/api/auth', AuthController), // ⬅️ direkt hier
    controller('/api', ApiController),       // ⬅️ enthält @UserRequired()
  ];

  @Get('/ping')
  index() {
    return new HttpResponseOK('Welcome to the MTG Tier List API!');
  }
}
