import { ServiceRegistry } from '@src/framework/container/ServiceRegistry';
import { ServiceProvider } from '@src/framework/services/ServiceProvider';
import { View } from '@src/http';

export class Counter {
  constructor(public readonly count: number) {}
}

export class ViewServiceProvider extends ServiceProvider {

  private counter: number;
  
  constructor() {
    super();
    this.counter = 0;
  }

  register(registry: ServiceRegistry): void {
    registry.registerFor(View, Counter, () => {
      this.counter++;
      return new Counter(this.counter);
    });
  }
}
