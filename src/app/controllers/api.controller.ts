import { Context, controller, Get, HttpResponseOK, UserRequired } from '@foal/core';
import { DeckController, GameController, ParticipationController, RatingController, StatisticsController, UserController, User_deckController } from './index';

@UserRequired()
export class ApiController {

  subControllers = [
    controller('/deck', DeckController),
    controller('/game', GameController),
    controller('/participation', ParticipationController),
    controller('/rating', RatingController),
    controller('/statistics', StatisticsController),
    controller('/user_deck', User_deckController),
    controller('/user', UserController)
  ];

  @Get('/')
  index(ctx: Context) {
    return new HttpResponseOK('Hello world!');
  }

}
