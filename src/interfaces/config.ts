import Knex from 'knex';
import { SessionOptions } from 'express-session';
import { Request } from 'express';
import { CookieOptions } from 'csurf';
import { Logger } from '../logger';

interface IMigrationConfig {
  directory: string;
  tableName: string;
  schemaName?: string;
  disableTransactions?: boolean;
}

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
  csrf: ICsrfOptions | false;
  db: Knex.Config;
  migrations: IMigrationConfig;
  session: SessionOptions | false;

  // optional
  basePath?: string;
  logger?: Logger;
  port?: number;
  serviceName?: string;
  static?: string;
}
