import session from 'express-session';
import { Request } from 'express';

/**
 * @class
 * 
 * A lightweight wrapper around the request session
 */
export class Session {
  public readonly session: session.SessionData;

  constructor(private readonly req: Request) {
    this.session = req.session;
  }

  /**
   * Whether or not a certain property is available in session storage
   */
  has(key: string): boolean {
    return this.session.hasOwnProperty(key);
  }

  /**
   * Gets a value out of session storage, or returns default (optional)
   * 
   * @param key 
   * @param defaultValue 
   */
  get<T>(key: string, defaultValue: T = undefined): T | undefined {
    return this.session[key] || defaultValue;
  }

  /**
   * Sets a value in the session data
   * 
   * @param key 
   * @param value 
   */
  set<T>(key: string, value: T): void {
    this.session[key] = value;
  }

  /**
   * Puts an item in flash storage
   * 
   * @param key 
   * @param msg 
   */
  flash(key: string, msg: any): number {
    return this.req.flash(key, msg);
  }

  /**
   * Gets an item out of flash storage
   * 
   * Response value is an array of strings that have
   * been flashed into that storage key
   * 
   * @param key 
   */
  getFlash(key: string): string[] {
    return this.req.flash(key);
  }

  /**
   * Gets a value out of flash storage, returns it after putting it back in.
   * 
   * @param key key to get out of session flash storage
   */
  reflash(key: string): string[] {
    const value = this.getFlash(key)
    value.length && value.forEach(msg => this.flash(key, msg));
    return value;
  }

  /**
   * Destroy the session (aka logging out if a user is authenticated)
   * 
   * @throws if a problem occurs trying to destroy the session
   */
  async destroy(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.req.session.destroy(err => {
        err ? reject(err) : resolve()
      });
    });
  }
}
