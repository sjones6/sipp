import { BaseException } from './BaseException';
import { devExceptionView, productionExceptionView } from './exception';
import { Logger } from '../logger';
import { Request, Response } from 'express';

export class ExceptionHandler {
  constructor(
    private readonly logger: Logger,
    private readonly mode: 'production' | 'development',
  ) {}
  handle(exception: BaseException, req: Request, res: Response): boolean {
    this.logger.error(`${exception.constructor.name}: ${exception.message}`);
    if (!res.headersSent) {
      res.status(exception.code);
      res.send(
        this.mode === 'production'
          ? productionExceptionView(req.id)
          : devExceptionView(exception, req, res),
      );
    }
    return true;
  }
  reportHandledException(exception: BaseException): void {}
  reportUnhandledException(exception: BaseException): void {}
}
