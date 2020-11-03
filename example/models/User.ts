import { Model } from "../../src";

export class User extends Model {
  static get tableName() {
    return 'users';
  }
}