import { Request } from 'express';
import { Model } from '../../db';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export class Auth {
  public isAuthenticated: boolean;
  constructor(private readonly req: Request) {
    this.isAuthenticated = !!req.user;
  }
  get user(): Model | undefined {
    return this.req.user;
  }
}
