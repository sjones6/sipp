import Knex from "knex";

interface IMigrationConfig {
  directory: string
  tableName: string
  schemaName?: string
  disableTransactions?: boolean
}

export interface IAppConfig {
  basePath?: string
  port?: number
  db: Knex.Config
  migrations: IMigrationConfig
}