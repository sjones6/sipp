import { Counter } from '../providers/ViewServiceProvider';
import { Logger, Middleware, Provide } from '@src/index';

export class CounterMiddleware extends Middleware {
  @Provide()
  async handle(counter: Counter, logger: Logger) {
    logger.debug(counter.count);
  }
}
