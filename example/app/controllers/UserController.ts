import { User } from '../models/User';
import {
  BaseException,
  Controller,
  Create,
  Get,
  IHTTPResponseFacade,
  NotFoundException,
  Post,
  Resolve,
} from '@src/index';
import { UsersList, ShowUser } from './Users';

export class UsersController extends Controller {
  @Get()
  public async listUsers(): Promise<any> {
    return this.view<User[]>(UsersList, await User.query());
  }

  @Post()
  public async createUser(@Create(User) user: User) {
    return this.redirect(`/users/${user.id}`);
  }

  @Get('/:user')
  public async getUser(@Resolve(User) user: User) {
    return this.view<User>(ShowUser, user);
  }

  onException(e: BaseException): boolean | IHTTPResponseFacade {
    switch (true) {
      case e instanceof NotFoundException:
        return this.json({ lost: true });
    }
    return false;
  }
}
