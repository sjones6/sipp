import { RouteMapper } from '../routing/RouteMapper';
import { ServiceProvider } from '../framework';
import { IServiceRegistryFn } from '../interfaces';

export class RouteMappingProvider extends ServiceProvider {
  constructor(private readonly routeMapper: RouteMapper) {
    super();
  }
  register(register: IServiceRegistryFn) {
    register('*', RouteMapper, () => this.routeMapper);
  }
}
