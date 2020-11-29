import { Request, Response } from 'express';
import { Logger } from '../../logger';
import { RouteMapper, IQuery } from '../../routing/RouteMapper';

class ObjectMapper {
  private _raw: any;
  private map: Map<string, any>;
  constructor(obj: object) {
    this.map = new Map(Object.entries(obj));
    this._raw = obj;
  }
  public has(key: string): boolean {
    return this.map.has(key);
  }
  public get(key: string): any {
    return this.map.get(key);
  }
  public raw() {
    return this._raw;
  }
}

export class Body extends ObjectMapper {}
export class Headers extends ObjectMapper {}
export class Params extends ObjectMapper {}
export class Query extends ObjectMapper {}

export class RequestSession {
  public readonly session: object;

  constructor(private readonly req: Request, private readonly res: Response) {
    this.session = req.session;
  }
  has(key: string): boolean {
    return {}.hasOwnProperty.call(this.session, key);
  }
  get<T>(key: string, defaultValue: T = undefined): T | undefined {
    return this.session[key] || defaultValue;
  }
  set(key: string, value: any) {
    this.session[key] = value;
  }
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
  public readonly body: Body;
  public readonly headers: Headers;
  public readonly logger: Logger;
  public readonly method: string;
  public readonly params: Params;
  public readonly path: string;
  public readonly query: Query;
  public readonly session: RequestSession;
  constructor(
    public readonly req: Request,
    public readonly res: Response,
    private readonly routeMapper: RouteMapper,
  ) {
    this.path = req.path;
    this.method = req.method;
    this.params = new Params(req.params || {});
    this.body = new Body(req.body || {});
    this.query = new Query(req.query || {});
    this.headers = new Headers(req.headers);
    this.session = new RequestSession(req, res);
    this.logger = req.logger;
  }

  url(name: string | Symbol, params?: object, query?: IQuery, method?: string) {
    return this.routeMapper.resolve(name, params, query, method);
  }

  csrfToken() {
    return this.req.csrfToken();
  }

  csrfField() {
    return `<input type="hidden" style="display: none; tab-index: -1;" value="${this.csrfToken()}" name="_csrf" />`;
  }
}