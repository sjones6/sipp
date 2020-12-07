import { IServiceRegistryFn } from 'src/interfaces';

export class ServiceProvider {
  /**
   * Do any async work to initialize the service provider
   *
   * This will be called _before_ register is called
   */
  public init(): void | Promise<void> {}

  public register(register: IServiceRegistryFn): void {}
}
