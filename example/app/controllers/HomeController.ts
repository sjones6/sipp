import { Controller, Get, RequestContext } from '@src/index';

export class HomeController extends Controller {
  public basePath = '';

  @Get('/', { name: 'home' })
  public getHome(ctx: RequestContext) {
    const { req } = ctx;
    return {
      path: req.path,
      method: req.method,
      home: ctx.url.alias('home'),
      user: ctx.url.alias('get-user', { user: 1 }),
      arbitrary: ctx.url.url('/some/path/:id', { id: 2 }, { foo: 2 }, 'patch'),
      flash: ctx.session.getFlash('info'),
      query: ctx.query,
      ts: Date.now(),
    };
  }

  @Get('/foo', { name: 'foo' })
  public getFoo() {
    return this.download({ foo: 1 });
  }
}
