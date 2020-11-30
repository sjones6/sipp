import { BaseException } from './BaseException';
import { RequestContext } from '../http';
import { exceptionView } from './exception';
import { Logger } from '../logger';

export class ExceptionHandler {
  constructor(private readonly logger: Logger) {}
  handle(exception: BaseException, ctx: RequestContext): boolean {
    this.logger.error(`${exception.constructor.name}: ${exception.message}`);
    if (!ctx.res.headersSent) {
      ctx.res.status(exception.code);
      ctx.res.send(exceptionView(exception));
    }
    return true;
  }
  reportHandledException(exception: BaseException): void {}
  reportUnhandledException(exception: BaseException): void {}
}
