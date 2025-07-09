import { Context, controller, Get, HttpResponseOK } from '@foal/core';
import { AuthController, DeckController, GameController, UserController, User_deckController } from './index';

export class ApiController {

  subControllers = [
    controller('/deck', DeckController),
    controller('/game', GameController),
    controller('/auth', AuthController),
    controller('/user_deck', User_deckController),
    controller('/user', UserController)
  ];

  @Get('/')
  index(ctx: Context) {
    return new HttpResponseOK('Hello world!');
  }

}
