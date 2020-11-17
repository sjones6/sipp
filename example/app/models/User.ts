import { Model } from '@src/index';

export class User extends Model {
  id: number;
  email: string;
  password: string;
  static get tableName() {
    return 'users';
  }
}
