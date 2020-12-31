import { ServiceProvider } from '../framework';
import { IServiceRegistryFn } from '../interfaces';
import { Middleware, Url, View } from '../http';
import { RouteMapper } from '../routing/RouteMapper';
import { Controller } from '../http';

export class UrlProvider extends ServiceProvider {
  constructor(
    private readonly staticPath: string,
    private readonly routeMapper: RouteMapper,
  ) {
    super();
  }
  register(register: IServiceRegistryFn) {
    register(
      [Controller, Middleware, View],
      Url,
      () => new Url(this.staticPath, this.routeMapper),
    );
  }
}
