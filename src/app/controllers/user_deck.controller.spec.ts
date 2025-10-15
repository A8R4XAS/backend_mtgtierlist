// std
import { ok, strictEqual } from 'assert';

// 3p
import { Context, createController, getHttpMethod, getPath, isHttpResponseOK } from '@foal/core';

// App
import { User_deckController } from './user_deck.controller';

describe('User_deckController', () => {

  let controller: User_deckController;

  beforeEach(() => controller = createController(User_deckController));

  describe('has a "foo" method that', () => {

    it('should handle requests at GET /.', () => {
      strictEqual(getHttpMethod(User_deckController, 'foo'), 'GET');
      strictEqual(getPath(User_deckController, 'foo'), '/');
    });

    it('should return an HttpResponseOK.', () => {
      const ctx = new Context({});
      ok(isHttpResponseOK(controller.getUser_Deck(ctx)));
    });

  });

});
