import { IServiceRegistryFn } from '@src/index';
import { ServiceProvider } from '@src/framework/services/ServiceProvider';
import { Middleware, View } from '@src/http';

export class Counter {
  constructor(public readonly count: number) {}
}

export class ViewServiceProvider extends ServiceProvider {
  private counter: number;

  constructor() {
    super();
    this.counter = 0;
  }

  register(register: IServiceRegistryFn): void {
    register([View, Middleware], Counter, () => {
      this.counter++;
      return new Counter(this.counter);
    });
  }
}
