import { User } from "../models/User";
import { Controller, Get, IRequestContext } from "../../src";

export class UserController extends Controller {
  @Get()
  public async listUsers(ctx: IRequestContext): Promise<void> {
    const users = await User.query()
    ctx.res.json(users);
  }

  @Get('/:id')
  public async getUser(ctx: IRequestContext) {
    const u = await User.query().where({
      id: ctx.params.id
    })
    ctx.res.json(u);
  }

  @Get('/create')
  public async createUser(ctx: IRequestContext) {
    const u = await User.query().insert({
      email: `${Date.now()}@email.com`,
      password: 'yohoo',
    })
    ctx.res.json(u);
  }

  @Get('/delete')
  public async deleteUsers(ctx: IRequestContext) {
    await User.query().delete()
    ctx.res.json({ msg: 'its done'});
  }
}