import { BaseException } from './BaseException';
import { devExceptionView, productionExceptionView } from './exception';
import { Logger } from '../logger';
import { Request, Response } from 'express';
import { HTTPResponder } from '../http/response/Responder';
import { HTTPResponse, ResponseBody } from 'src/http';

type ExceptionHandledResponse = ResponseBody | HTTPResponse<any> | false | Promise<ResponseBody | HTTPResponse<any> | false>;

export class ExceptionHandler extends HTTPResponder {
  constructor(
    private readonly logger: Logger,
    private readonly mode: 'production' | 'development' | string,
  ) {
    super();
  }
  handle(
    exception: BaseException,
    req: Request,
    res: Response,
  ): ExceptionHandledResponse {
    this.logger.error(`${exception.constructor.name}: ${exception.message}`);
    if (!res.headersSent) {
      return this.reply(
        this.mode === 'production'
          ? productionExceptionView(req.id)
          : devExceptionView(exception, req, res),
        undefined,
        exception.code,
      );
    }
    return false;
  }

  /**
   * The exception was caught but handled by an exception handler
   */
  reportHandledException(exception: BaseException): void | Promise<void> {}

  /**
   * The exception was caught and unhandled by any exception handler
   */
  reportUnhandledException(exception: BaseException): void | Promise<void> {}
}
