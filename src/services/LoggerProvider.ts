import { ServiceProvider } from '../framework';
import { IServiceRegistryFn } from '../interfaces';
import { Logger } from '../logger';

export class LoggerProvider extends ServiceProvider {
  constructor(private readonly logger: Logger) {
    super();
  }
  register(register: IServiceRegistryFn) {
    register('*', Logger, () => this.logger);
  }
}
