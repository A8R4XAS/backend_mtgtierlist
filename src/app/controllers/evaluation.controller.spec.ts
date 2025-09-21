// std
import { ok, strictEqual } from 'assert';

// 3p
import { Context, createController, getHttpMethod, getPath, isHttpResponseOK } from '@foal/core';

// App
import { EvaluationController } from './evaluation.controller';

describe('EvaluationController', () => {

  let controller: EvaluationController;

  beforeEach(() => controller = createController(EvaluationController));

  describe('has a "foo" method that', () => {

    it('should handle requests at GET /.', () => {
      strictEqual(getHttpMethod(EvaluationController, 'foo'), 'GET');
      strictEqual(getPath(EvaluationController, 'foo'), '/');
    });

    it('should return an HttpResponseOK.', () => {
      const ctx = new Context({});
      ok(isHttpResponseOK(controller.foo(ctx)));
    });

  });

});
