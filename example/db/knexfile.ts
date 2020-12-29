import 'dotenv';
import Knex from 'knex';
import { resolve } from 'path';

const CWD = process.cwd();

const migrations = {
  extension: 'ts',
  directory: resolve(__dirname, 'db/migrations'),
  tableName: '_migrations',
};

export const development: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: resolve(CWD, './tmp/db.sqlite3'),
  },
  migrations,
  seeds: {
    directory: resolve(__dirname, 'db/migrations'),
  },
  useNullAsDefault: true,
};

export const production: Knex.Config = {
  client: 'pg',
  connection: {
    port: parseInt(process.env.DATABASE_PORT),
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_ACCESS_KEY,
  },
  pool: {
    min: process.env.DATABASE_POOL_MIN
      ? parseInt(process.env.DATABASE_POOL_MIN)
      : 2,
    max: process.env.DATABASE_POOL_MAX
      ? parseInt(process.env.DATABASE_POOL_MAX)
      : 10,
  },
  migrations,
};
