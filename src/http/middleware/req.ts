import crypto from 'crypto';
import { Request } from 'express';
import { logger, Logger } from '../../logger';
import { IMiddlewareFunc } from '../../interfaces';
import { initStore } from '../../utils/async-store';

declare global {
  namespace Express {
    interface Request {
      id: string;
      received: Date;
      logger: Logger;
    }
  }
}

export const reqInfoLoggingMiddleware: IMiddlewareFunc = (
  req: Request,
): void => {
  initStore();
  req.logger = logger;
  req.id = crypto.randomBytes(8).toString('hex');
  req.received = new Date();
  req.logger.addScope({
    id: req.id,
    ip: req.ip,
    path: req.path,
    method: req.method,
    received: req.received,
  });
};
