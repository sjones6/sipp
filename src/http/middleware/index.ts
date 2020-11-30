import crypto from 'crypto';
import { Request, Response } from 'express';
import { logger, Logger } from '../../logger';
import { IMiddlewareFunc, ISippNextFunc } from '../../interfaces';

declare global {
  namespace Express {
    interface Request {
      id: string;
      received: number;
      logger: Logger;
    }
  }
}

export const reqInfoLoggingMiddleware: IMiddlewareFunc = async (
  req: Request,
  res: Response,
  next: ISippNextFunc,
): Promise<void> => {
  req.id = crypto.randomBytes(8).toString('hex');
  req.logger = logger.childLogger({ req: req.id });
  req.received = Date.now();
  req.logger.addScope({
    ip: req.ip,
    path: req.path,
    method: req.method,
    received: req.received,
  });
  await next();
  req.logger.addScope({
    status: res.statusCode,
  });
  req.logger.info(`duration ${Date.now() - req.received}ms`);
};
