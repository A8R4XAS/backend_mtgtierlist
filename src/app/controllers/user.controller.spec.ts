// std
import { ok, strictEqual } from 'assert';

// 3p
import { createController, getHttpMethod, getPath, isHttpResponseOK } from '@foal/core';

// App
import { UserController } from './user.controller';

describe('UserController', () => {

  let controller: UserController;

  beforeEach(() => controller = createController(UserController));

  describe('has a "foo" method that', () => {

    it('should handle requests at GET /.', () => {
      strictEqual(getHttpMethod(UserController, 'foo'), 'GET');
      strictEqual(getPath(UserController, 'foo'), '/');
    });

    it('should return an HttpResponseOK.', () => {
      ok(isHttpResponseOK(controller.getUsers()));
    });

  });

});
