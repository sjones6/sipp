import { Foo } from '../utils/Foo';
import { ServiceProvider } from '@src/framework/services/ServiceProvider';
import { IServiceRegistryFn } from '@src/index';

export class FooServiceProvider extends ServiceProvider {
  register(register: IServiceRegistryFn): void {
    register('*', Foo, () => {
      return new Foo();
    });
  }
}
