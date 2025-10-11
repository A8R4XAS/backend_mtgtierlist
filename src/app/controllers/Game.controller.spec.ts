// std
import { ok, strictEqual } from 'assert';

// 3p
import { Context, createController, getHttpMethod, getPath, isHttpResponseOK } from '@foal/core';

// App
import { GameController } from './Game.controller';

describe('GameController', () => {

  let controller: GameController;

  beforeEach(() => controller = createController(GameController));

  describe('has a "foo" method that', () => {

    it('should handle requests at GET /.', () => {
      strictEqual(getHttpMethod(GameController, 'foo'), 'GET');
      strictEqual(getPath(GameController, 'foo'), '/');
    });

    it('should return an HttpResponseOK.', () => {
      const ctx = new Context({});
      ok(isHttpResponseOK(controller.getGame(ctx)));
    });

  });

});
