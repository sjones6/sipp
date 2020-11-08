import { join } from 'path';
import { IAppConfig } from '../../src';

export const config: IAppConfig = {
  db: {
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: async () => ({
      filename: join(__dirname, 'tmp', 'db.sqlite')
    })
  },
  migrations: {
    directory: join(__dirname, 'migrations'),
    tableName: '_migrations',
  }
}