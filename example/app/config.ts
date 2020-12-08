import { join } from 'path';
import { IAppConfig } from '@src/index';

export const config: IAppConfig = {
  port: 4000,
  db: {
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: async () => ({
      filename: join(process.cwd(), 'tmp', 'db.sqlite'),
    }),
  },
  migrations: {
    directory: join(process.cwd(), 'migrations'),
    tableName: '_migrations',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'keyboard cat',
  },
  csrf: {
    cookie: true,
  },
  static: 'public',
};
