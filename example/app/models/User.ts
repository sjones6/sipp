import { Model } from "../../src";

export class User extends Model {
  id: number
  email: string
  password: string
  static get tableName() {
    return 'users';
  }
}