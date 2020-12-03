import session from 'express-session';
import { Request } from 'express';

export class Session {
  public readonly session: session.SessionData;

  constructor(private readonly req: Request) {
    this.session = req.session;
  }
  has(key: string): boolean {
    return {}.hasOwnProperty.call(this.session, key);
  }
  get<T>(key: string, defaultValue: T = undefined): T | undefined {
    return this.session[key] || defaultValue;
  }
  set(key: string, value: any) {
    this.session[key] = value;
  }
  getFlash(key: string): string[] {
    return this.req.flash(key);
  }
  flash(key: string, msg: any) {
    return this.req.flash(key, msg);
  }
  reflash(key: string) {
    this.req.flash(key, this.req.flash(key));
  }
}
