import { Controller, Get, RequestContext } from '@src/index';

export class HomeController extends Controller {
  public basePath = '';

  @Get('/', { name: 'home' })
  public getHome(ctx: RequestContext) {
    return {
      path: ctx.path,
      method: ctx.method,
      home: ctx.url('home'),
      user: ctx.url('get-user', { user: 1 }),
      flash: ctx.session.getFlash('info'),
      query: ctx.query,
    };
  }

  @Get('/foo', { name: 'foo' })
  public getFoo() {
    return this.download({ foo: 1 });
  }
}
