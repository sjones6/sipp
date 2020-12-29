import { Model } from './Model';
import Knex from 'knex';
import { join } from 'path';

export class Connection {
  private readonly knex: Knex;
  constructor(mode: string, knexFilePath?: string) {
    const knexConfigPath = knexFilePath || join(process.cwd(), 'knexfile');
    const config = require(knexConfigPath);
    if (!config || !config[mode]) {
      throw new Error(
        `knexfile does not export a config for application mode ${mode}`,
      );
    }
    this.knex = Knex(config[mode]);
  }
  public connect(): void {
    Model.knex(this.knex);
  }
  public disconnect(): Promise<void> {
    return this.knex.destroy();
  }
}
