import { Request, Response } from 'express';

export interface ISippNextFunc {
  (error?: Error, response?: any): void | undefined | Promise<any>;
}

export interface IMiddlewareFunc {
  (req: Request, res: Response, next: ISippNextFunc): void | Promise<any>;
}
