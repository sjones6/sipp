import { BaseException } from './BaseException';
import { devExceptionView, productionExceptionView } from './exception';
import { Logger } from '../logger';
import { Request, Response } from 'express';
import { HTTPResponder } from '../http/response/Responder';
import { HTMLResponse, HTTPResponse } from 'src/http';

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
  ): HTTPResponse<string> | boolean | Promise<HTTPResponse<any> | boolean> {
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
  reportHandledException(exception: BaseException): void {}
  reportUnhandledException(exception: BaseException): void {}
}
