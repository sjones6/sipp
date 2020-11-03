import { Request, Response } from 'express';

export interface IRequestContext {
  path: string,
  method: string,
  req: Request,
  res: Response
}