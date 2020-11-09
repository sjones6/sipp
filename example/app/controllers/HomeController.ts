import { Controller, Get, IRequestContext } from "../../../src";

export class HomeController extends Controller {
  public basePath = '';

  @Get('/')
  public getHome(ctx: IRequestContext) {
    ctx.res.json({ path: ctx.path, method: ctx.method });
  }

  @Get('/foo')
  public getFoo(ctx: IRequestContext) {
    return this.redirect('/');
  }
}