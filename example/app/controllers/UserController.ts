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
  Apply,
  transacting,
  ApplyAll,
} from '@src/index';
import { UsersList, ShowUser } from './Users';

@ApplyAll(transacting)
export class UsersController extends Controller {
  @Get()
  public async listUsers(ctx: RequestContext): Promise<string> {
    return UsersList(await User.query(), ctx);
  }

  @Post('/', { name: 'user.create' })
  @Apply(transacting)
  public async createUser(user: User) {
    const validation = await user.validate();
    await user.save();
    throw new Error('fooled ya!');
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
  @Apply(transacting)
  public async deleteUser(user: User) {
    await user.delete();
    return this.redirect(`/users`);
  }

  onException(e: BaseException): false | ResponseBody {
    switch (true) {
      case e instanceof NotFoundException:
        return { lost: true };
      default:
        return this.redirect(`/users`);
    }
  }
}
