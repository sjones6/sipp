import { IRequestContext } from "./interfaces";
import { Request, Response } from 'express';

export class RequestContext implements IRequestContext {
  public readonly path: string;
  public readonly method: string;
  public readonly params?: any;
  public readonly body?: any;
  constructor(public readonly req: Request, public readonly res: Response) {
    this.path = req.path;
    this.method = req.method;
    this.params = req.params;
    this.body = req.body;
  }
}
