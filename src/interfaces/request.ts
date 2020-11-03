import { Request, Response } from 'express';

export interface IRequestContext {
  path: string,
  method: string,
  params?: any,
  body?: any,
  req: Request,
  res: Response
}