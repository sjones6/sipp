import { Controller, Get, RequestContext } from '@src/index';

export class HomeController extends Controller {
  public basePath = '';

  @Get('/', { name: 'home' })
  public getHome(ctx: RequestContext) {
    return this.json({
      path: ctx.path,
      method: ctx.method,
      home: ctx.url('home'),
      user: ctx.url('get-user', { user: 1 }),
      flash: ctx.session.getFlash('info'),
    });
  }

  @Get('/foo', { name: 'foo' })
  public getFoo(ctx: RequestContext) {
    ctx.session.flash('info', 'msg');
    return this.redirect('/');
  }
}
