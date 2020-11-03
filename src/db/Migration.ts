import Knex from "knex";

export class Migration {
  public up(knex: Knex): Promise<any> {
    return Promise.resolve();
  }
  public down(knex: Knex): Promise<any> {
    return Promise.resolve();
  }
}