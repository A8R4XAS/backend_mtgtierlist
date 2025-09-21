// std
import { ok, strictEqual } from 'assert';

// 3p
import { Context, createController, getHttpMethod, getPath, isHttpResponseOK } from '@foal/core';

// App
import { ParticipationController } from './participation.controller';

describe('ParticipationController', () => {

  let controller: ParticipationController;

  beforeEach(() => controller = createController(ParticipationController));

  describe('has a "foo" method that', () => {

    it('should handle requests at GET /.', () => {
      strictEqual(getHttpMethod(ParticipationController, 'foo'), 'GET');
      strictEqual(getPath(ParticipationController, 'foo'), '/');
    });

    it('should return an HttpResponseOK.', () => {
      const ctx = new Context({});
      ok(isHttpResponseOK(controller.foo(ctx)));
    });

  });

});
