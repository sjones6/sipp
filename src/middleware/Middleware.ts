import crypto from 'crypto';
import { NextFunction, Request, Response, } from 'express';
import { logger, ScopedLogger } from '../logger';

declare global {
  namespace Express {
      interface Request {
          id: string,
          received: Date,
          logger: ScopedLogger
      }
  }
}

export class Middleware {
  constructor(private readonly handler) {}
  public handle(req: Request, res: Response, next: NextFunction) {
    this.handler(req, res, next);
  }
  public bind() {
    return this.handle.bind(this);
  }
}

export class ReqIdMiddleware extends Middleware {
  constructor() {
    super((req: Request, res: Response, next: NextFunction) => {
      req.id = crypto.randomBytes(8).toString('hex');
      req.received = new Date();
      next();
    });
  }
}

export class ReqLoggerMiddleware extends Middleware {
  constructor() {
    super((req: Request, res: Response, next: NextFunction) => {
      req.logger = logger.scopedLogger({ req: req.id });
      next();
    });
  }
}

export class ReqInfoLoggingMiddleware extends Middleware {
  constructor() {
    super((req: Request, res: Response, next: NextFunction) => {
      req.logger.addScope({
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      next();
    });
  }
}