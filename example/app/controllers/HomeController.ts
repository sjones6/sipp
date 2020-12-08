import { Foo } from '../utils/Foo';
import { Controller, Get, Query, Req, Session, Url } from '@src/index';

export class HomeController extends Controller {
  public basePath = '';

  @Get('/', { name: 'home' })
  public getHome(url: Url, session: Session, query: Query, req: Req, foo: Foo) {
    return {
      path: req.path,
      method: req.method,
      home: url.alias('home'),
      user: url.alias('get-user', { user: 1 }),
      arbitrary: url.url('/some/path/:id', { id: 2 }, { foo: 2 }, 'patch'),
      flash: session.getFlash('info'),
      query: query,
      ts: Date.now(),
      reqId: req.id,
      id: foo.name,
    };
  }

  @Get('/foo', { name: 'foo' })
  public getFoo() {
    return this.download({ foo: 1 });
  }

  @Get('/error', { name: 'error' })
  public getError() {
    throw new Error('you fool!');
  }
}
