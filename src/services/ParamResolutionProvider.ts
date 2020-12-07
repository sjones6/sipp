import { IServiceRegistryFn } from '../interfaces';
import { Controller } from '../Controller';
import { ServiceProvider } from '../framework';
import {
  Body,
  Headers,
  Params,
  Query,
  Session,
  Req,
  Res,
  View,
  Csrf,
  Middleware,
} from '../http';
import { Logger } from '../logger';
import { getStore } from '../utils/async-store';
import { STORAGE } from 'src/constants';
import { Request } from 'express';

export class ParamResolutionProvider extends ServiceProvider {
  public register(register: IServiceRegistryFn): void {

    // no view
    register([Controller, Middleware], Res, () => {
      const req = this.withRequest();
      return new Res(req, req.res);
    });

    // controller, view, middleware
    register([Controller, Middleware, View], Req, () => {
      const req = this.withRequest();
      return new Req(req);
    });
    register(
      [Controller, Middleware, View],
      Body,
      () => new Body(this.withRequest().body),
    );
    register(
      [Controller, Middleware, View],
      Headers,
      () => new Headers(this.withRequest().headers),
    );
    register(
      [Controller, Middleware, View],
      Params,
      () => new Params(this.withRequest().params),
    );
    register(
      [Controller, Middleware, View],
      Query,
      () => new Query(this.withRequest().query),
    );
    register(
      [Controller, Middleware, View],
      Session,
      () => new Session(this.withRequest()),
    );
    register(
      [Controller, Middleware, View],
      Logger,
      () => this.withRequest().logger,
    );
    register(
      [Controller, Middleware, View],
      Csrf,
      () => new Csrf(this.withRequest()),
    );
  }

  private withRequest(): Request {
    return getStore().get(STORAGE.REQ_KEY);
  }
}
