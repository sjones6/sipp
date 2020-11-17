import { Request, Response } from 'express';
import { RouteMapper, Query } from './routing/RouteMapper';

export class RequestSession {
  constructor(private readonly req: Request, private readonly res: Response) {}

  getFlash(key: string): string[] {
    return this.req.flash(key);
  }
  flash(key: string, msg: any) {
    return this.req.flash(key, msg);
  }
  reflash(key: string) {
    this.req.flash(key, this.req.flash(key));
  }
}

export class RequestContext {
  public readonly path: string;
  public readonly method: string;
  public readonly params?: any;
  public readonly body?: any;
  public readonly query?: object;
  public readonly session: RequestSession;
  constructor(
    public readonly req: Request,
    public readonly res: Response,
    private readonly routeMapper: RouteMapper,
  ) {
    this.path = req.path;
    this.method = req.method;
    this.params = req.params;
    this.body = req.body;
    this.query = req.query;
    this.session = new RequestSession(req, res);
  }

  url(name: string | Symbol, params?: object, query?: Query, method?: string) {
    return this.routeMapper.resolve(name, params, query, method);
  }

  csrfToken() {
    return this.req.csrfToken();
  }

  csrfField() {
    return `<input type="hidden" style="display: none; tab-index: -1;" value="${this.csrfToken()}" name="_csrf" />`;
  }
}
