import { User } from "../../models/User";
import {
  BaseException,
  Controller,
  Create,
  Get,
  IHTTPResponseFacade,
  json,
  NotFoundException,
  Post,
  Resolve,
  view,
  redirect,
} from "../../../src";
import { UsersList, ShowUser } from './Users';

export class UsersController extends Controller {
  @Get()
  public async listUsers(): Promise<any> {
    return view<User[]>(UsersList, await User.query());
  }

  @Post()
  public async createUser(@Create(User) user: User) {
    return redirect(`/users/${user.id}`);
  }

  @Get('/:user')
  public async getUser(@Resolve(User) user: User) {
    return view<User>(ShowUser, user);
  }

  onException(e: BaseException): boolean | IHTTPResponseFacade {
    switch (true) {
      case e instanceof NotFoundException:
        return json({ lost: true });
    }
    return false;
  }
}