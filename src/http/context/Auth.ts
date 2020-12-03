import { Request } from 'express';
import { Model } from '../../db';

export class Auth<User extends Model> {
  public isAuthenticated: boolean;
  constructor(private readonly req: Request) {
    this.isAuthenticated = !!req['user'];
  }
  get user(): User {
    return this.req['user'];
  }
}
