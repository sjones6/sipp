import { Model } from '@src/index';
import { IsEmail, IsString, Min, Max } from '@src/validation';

export class User extends Model {
  id: number;

  @IsEmail()
  email: string;

  @IsString()
  @Min(6)
  @Max(24)
  password: string;
  static fillable() {
    return ['email', 'password'];
  }
  static get tableName() {
    return 'users';
  }
}
