import { User } from '../models/User';
import {
  BaseException,
  Controller,
  Delete,
  Get,
  IHTTPResponseFacade,
  ScopedLogger,
  NotFoundException,
  Post,
  RequestSession,
} from '@src/index';
import { UsersList, ShowUser } from './Users';

export class UsersController extends Controller {
  @Get()
  public async listUsers(): Promise<any> {
    return this.view<User[]>(UsersList, await User.query());
  }

  @Post('/', { name: 'user.create' })
  public async createUser(user: User) {
    // < user model is created just by type-hinting User
    await user.save();
    return this.redirect(`/users/${user.id}`);
  }

  @Get('/:user', { name: 'get-user' })
  public async getUser(
    user: User,
    logger: ScopedLogger,
    session: RequestSession,
  ) {
    logger.debug(`getting user ${user.id}`);
    session.flash('welcome', `Hi, ${user.email}!`);
    return this.view<User>(ShowUser, user);
  }

  @Delete('/:user', { name: 'delete-user' })
  public async deleteUser(user: User) {
    const r = await user.delete();
    return this.redirect(`/users`);
  }

  onException(e: BaseException): boolean | IHTTPResponseFacade {
    switch (true) {
      case e instanceof NotFoundException:
        return this.json({ lost: true });
    }
    return false;
  }
}
