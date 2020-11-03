import { Model } from './Model'
import Knex from 'knex';
import { IAppConfig } from '../interfaces';

export class Connection {
  private readonly knex: Knex
  constructor(config: IAppConfig) {
    this.knex = Knex(config.db);
  }
  public connect(): void {
    Model.knex(this.knex);
  }
  public disconnect(): Promise<void> {
    return this.knex.destroy();
  }
}