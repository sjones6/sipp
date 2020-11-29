import { BaseException } from './BaseException';
import { RequestContext } from '../http';
import { exceptionView } from './exception';

export class ExceptionHandler {
  handle(exception: BaseException, ctx: RequestContext): boolean {
    ctx.logger.error(`${exception.constructor.name}: ${exception.message}`);
    if (!ctx.res.headersSent) {
      ctx.res.status(exception.code);
      ctx.res.send(exceptionView(exception));
    }
    return true;
  }
}
