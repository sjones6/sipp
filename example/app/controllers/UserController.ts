import { User } from '../models/User';
import {
  BaseException,
  Controller,
  Delete,
  Get,
  ResponseBody,
  Logger,
  NotFoundException,
  Post,
  RequestSession,
  RequestContext,
} from '@src/index';
import { UsersList, ShowUser } from './Users';

export class UsersController extends Controller {
  @Get()
  public async listUsers(ctx: RequestContext): Promise<string> {
    return UsersList(await User.query(), ctx);
  }

  @Post('/', { name: 'user.create' })
  public async createUser(user: User) {
    await user.save();
    return this.redirect(`/users/${user.id}`);
  }

  @Get('/:user', { name: 'get-user' })
  public async getUser(
    user: User,
    logger: Logger,
    session: RequestSession,
    ctx: RequestContext,
  ) {
    logger.debug(`getting user ${user.id}`);
    session.flash('welcome', `Hi, ${user.email}!`);
    return ShowUser(user, ctx);
  }

  @Get('/:user/download', { name: 'download-user' })
  public async downloadUser(user: User) {
    return this.download(user, `${user.email}.json`);
  }

  @Delete('/:user', { name: 'delete-user' })
  public async deleteUser(user: User) {
    await user.delete();
    return this.redirect(`/users`);
  }

  onException(e: BaseException): false | ResponseBody {
    switch (true) {
      case e instanceof NotFoundException:
        return { lost: true };
    }
    return false;
  }
}
