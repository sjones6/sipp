import { Model } from '@src/index';

export class User extends Model {
  id: number;
  email: string;
  password: string;
  static fillable() {
    return ['email', 'password'];
  }
  static get tableName() {
    return 'users';
  }
}
