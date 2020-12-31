import { IServiceRegistryFn } from '../interfaces';
import { Controller } from '../http';
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
import { getStore } from '../utils/async-store';
import { STORAGE } from 'src/constants';
import { Request } from 'express';

export class ParamResolutionProvider extends ServiceProvider {
  public register(register: IServiceRegistryFn): void {
    register('*', Res, () => {
      const req = this.withRequest();
      return new Res(req, req.res);
    });
    register('*', Req, () => {
      const req = this.withRequest();
      return new Req(req);
    });
    register(
      '*',
      Body,
      (resolve, Type) => new Type(this.withRequest().body),
    );
    register(
      '*',
      Headers,
      (resolve, Type) => new Type(this.withRequest().headers),
    );
    register(
      '*',
      Params,
      (resolve, Type) => new Type(this.withRequest().params),
    );
    register(
      '*',
      Query,
      (resolve, Type) => new Type(this.withRequest().query),
    );
    register(
      '*',
      Session,
      () => new Session(this.withRequest()),
    );
    register(
      '*',
      Csrf,
      () => new Csrf(this.withRequest()),
    );
  }

  private withRequest(): Request {
    return getStore().get(STORAGE.REQ_KEY);
  }
}
