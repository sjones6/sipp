import { BaseException } from './BaseException';
import { RequestContext } from '../RequestContext';
import { exceptionView } from './exception';

export class ExceptionHandler {
  handle(exception: BaseException, ctx: RequestContext): boolean {
    ctx.logger.info('handling exception');
    if (!ctx.res.headersSent) {
      ctx.res.status(exception.code);
      ctx.res.send(exceptionView(exception));
    }
    return true;
  }
}
