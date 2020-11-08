import { Request, Response } from 'express';

export interface IRequestContext {
  readonly path: string,
  readonly method: string,
  readonly params?: any,
  readonly body?: any,
  readonly req: Request,
  readonly res: Response
}
