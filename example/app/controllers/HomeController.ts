import { Controller, Ctx, Get, Query, RequestContext } from '@src/index';

export class HomeController extends Controller {
  public basePath = '';

  @Get('/', { name: 'home' })
  public getHome(@Ctx() ctx: RequestContext, @Query() query) {
    return this.json({
      path: ctx.path,
      method: ctx.method,
      home: ctx.url('home'),
      user: ctx.url('get-user', { user: 1 }),
      flash: ctx.session.getFlash('info'),
      query
    });
  }

  @Get('/foo', { name: 'foo' })
  public getFoo(ctx: RequestContext) {
    ctx.session.flash('info', 'msg');
    return this.redirect('/');
  }
}
