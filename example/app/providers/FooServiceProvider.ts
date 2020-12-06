import { Foo } from '../utils/Foo';
import { ServiceRegistry } from '@src/framework/container/ServiceRegistry';
import { ServiceProvider } from '@src/framework/services/ServiceProvider';
import { RequestContext } from '@src/http';

export class FooServiceProvider extends ServiceProvider {
  register(registry: ServiceRegistry): void {
    registry.registerFor<Foo>('*', Foo, () => {
      return new Foo();
    });
  }
}
