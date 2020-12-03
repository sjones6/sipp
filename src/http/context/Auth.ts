import { Request } from 'express';
import { Model } from '../../db';

export class Auth {
  public isAuthenticated: boolean;
  public userPath: string = 'user';
  constructor(private readonly req: Request) {
    this.isAuthenticated = !!req[this.userPath];
  }
  user<User extends Model>(): User {
    return this.req[this.userPath];
  }
}
