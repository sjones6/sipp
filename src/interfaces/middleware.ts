import { Request, Response, NextFunction } from 'express';

export interface ISippNextFunc {
  (error?: Error): void | undefined | Promise<any>;
}

export interface IMiddlewareFunc {
  (req: Request, res: Response, next: ISippNextFunc): void | Promise<any>;
}
