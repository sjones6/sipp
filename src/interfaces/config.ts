import { SessionOptions } from 'express-session';
import { Request } from 'express';
import { CookieOptions } from 'csurf';
import { Logger } from '../logger';

interface ICsrfOptions {
  value?: (req: Request) => string;
  /**
   * @default false
   */
  cookie?: CookieOptions | boolean;
  ignoreMethods?: string[];
  sessionKey?: string;
}

export interface IAppConfig {
  // required
  mode: 'production' | 'development' | string;
  csrf: ICsrfOptions | false;
  session: SessionOptions | false;

  // optional
  basePath?: string;
  knexPath?: string;
  logMode?: 'production' | 'development' | string;
  logger?: Logger;
  port?: number;
  serviceName?: string;
  static?: string;
}
