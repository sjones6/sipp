import { IncomingMessage, ServerResponse } from 'http';
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

type MiddlewareTest = string | RegExp;

type MiddlwareOptions<Opt> = false | Opt | [MiddlewareTest, Opt];

export interface IAppConfig {
  // required
  mode: 'production' | 'development' | string;

  // optional
  basePath?: string;
  knexPath?: string;
  logMode?: 'production' | 'development' | string;
  logger?: Logger;
  port?: number;
  serviceName?: string;

  middleware?: {
    body?: MiddlwareOptions<{
      extended?: boolean;
      inflate?: boolean;
      limit?: number | string;
      parameterLimit?: number;
      type?: string;
      verify?: (
        req: IncomingMessage,
        res: ServerResponse,
        buf: Buffer,
        encoding: string,
      ) => void;
    }>;
    cookieParser?: MiddlwareOptions<
      [
        secret: string,
        opt?: {
          decode: Function;
        },
      ]
    >;
    csrf?: MiddlwareOptions<ICsrfOptions>;
    json?: MiddlwareOptions<{
      inflate?: boolean;
      reviver?: (key: string, value: any) => any;
      limit?: number | string;
      strict?: boolean;
      type?: 'string';
      verify?: (
        req: IncomingMessage,
        res: ServerResponse,
        buf: Buffer,
        encoding: string,
      ) => void;
    }>;
    session?: MiddlwareOptions<SessionOptions>;
    static?: MiddlwareOptions<{
      path: string;
    }>;
  };
}
