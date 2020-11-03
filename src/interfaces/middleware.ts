import { Request, Response, NextFunction } from 'express';

export interface IMiddlewareFunc {
  (req: Request, res: Response, next: NextFunction)
}