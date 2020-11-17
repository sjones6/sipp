import Knex from 'knex';
import { SessionOptions } from 'express-session';
import { Request } from 'express';
import { CookieOptions } from 'csurf';

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
  basePath?: string;
  static?: string;
  port?: number;
  db: Knex.Config;
  migrations: IMigrationConfig;
  session: SessionOptions | false;
  csrf: ICsrfOptions | false;
}
