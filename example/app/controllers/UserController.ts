import { User } from '../models/User';
import {
  BaseException,
  Body,
  Controller,
  Session,
  RequestSession,
  Get,
  IHTTPResponseFacade,
  NotFoundException,
  Param,
  Post,
  Delete,
} from '@src/index';
import { UsersList, ShowUser } from './Users';

export class UsersController extends Controller {
  @Get()
  public async listUsers(): Promise<any> {
    return this.view<User[]>(UsersList, await User.query());
  }

  @Post('', { name: 'create-user' })
  public async createUser(@Body() user, @Session() session: RequestSession) {
    user = await User.query().insert(user);
    session.flash('success', 'yay!');
    return this.redirect(`/users/${user.id}`);
  }

  @Get('/:user', { name: 'get-user' })
  public async getUser(@Param('user') id) {
    return this.view<User>(ShowUser, await User.query().findById(id));
  }

  @Delete('/:user', { name: 'delete-user' })
  public async deleteUser(@Param('user') id) {
    await User.query().deleteById(id);
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
