import { BaseException } from './BaseException';
import { exceptionView } from './exception';
import { Logger } from '../logger';
import { Request, Response } from 'express';

export class ExceptionHandler {
  constructor(private readonly logger: Logger) {}
  handle(exception: BaseException, req: Request, res: Response): boolean {
    this.logger.error(`${exception.constructor.name}: ${exception.message}`);
    if (!res.headersSent) {
      res.status(exception.code);
      res.send(exceptionView(exception));
    }
    return true;
  }
  reportHandledException(exception: BaseException): void {}
  reportUnhandledException(exception: BaseException): void {}
}
