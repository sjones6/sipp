import { Controller, Get, ControllerMiddleware, Middleware, IRequestContext } from "../../src";

export class UserController extends Controller {
  @Get()
  public listUsers(ctx: IRequestContext) {
    ctx.res.json({ path: ctx.path, method: ctx.method });
  }

  @Get('/:id')
  public getUser(ctx: IRequestContext) {
    ctx.res.json({ id: ctx.req.params.id });
  }
}