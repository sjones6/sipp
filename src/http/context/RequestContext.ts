import { Request, Response } from 'express';
import session from 'express-session';
import { Logger } from '../../logger';
import { RouteMapper, IQuery } from '../../routing/RouteMapper';
import { CanValidate, validate, validateSync } from '../../validation/Validator';

const TRUE_PRIVATE = Symbol('true private');

class ObjectMapper implements CanValidate {
  constructor(obj: object) {
    this[TRUE_PRIVATE] = {
      map: new Map(Object.entries(obj)),
      raw: obj
    }
    Object.assign(this, obj);
  }
  public set(key: string, value: any): void {
    const { map, raw } = this[TRUE_PRIVATE];
    raw[key] = value;
    map.set(key, value);
    Object.assign(this, { [key]: value });
  }
  public has(key: string): boolean {
    return this[TRUE_PRIVATE].map.has(key);
  }
  public get<T>(key: string, defaultValue?: T): T {
    return this.has(key) ? this[TRUE_PRIVATE].map.get(key) : defaultValue;
  }
  public raw(): object {
    return this[TRUE_PRIVATE].raw;
  }
  public validate() {
    return validate(this);
  }
  public validateSync() {
    return validateSync(this);
  }
}

export class Body extends ObjectMapper { }
export class Headers extends ObjectMapper { }
export class Params extends ObjectMapper { }
export class Query extends ObjectMapper { }
export class Old extends ObjectMapper { }

export class RequestSession {
  public readonly session: session.SessionData;

  constructor(private readonly req: Request) {
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
  public readonly old: Old;
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
    this.session = new RequestSession(req);
    this.logger = req.logger;

    // get old input
    const [oldInput] = this.session.getFlash('__old__');
    let old;
    if (oldInput) {
      try {
        old = new Old(JSON.parse(oldInput));
      } catch (err) {
        this.logger.debug('failed to parse old input');
      }
    }
    this.old = old || new Old({});

    // save body for next req
    if (this.session.flash) {
      this.session.flash('__old__', JSON.stringify(req.body));
    }
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

  back() {
    this.session.flash('__old__', JSON.stringify(this.body.raw()));
    this.res.redirect(302, this.req.get('Referrer'));
  }
}
