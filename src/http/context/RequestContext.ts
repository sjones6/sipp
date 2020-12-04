import { Logger } from '../../logger';
import { Request, Response } from 'express';
import { RouteMapper } from '../../routing/RouteMapper';
import { Body, Headers, Params, Query, Old } from './Req';
import { Session } from './Session';
import { Url } from './Url';
import { Auth } from './Auth';

export const CONTEXT_KEY = 'context-storage-key';

export class RequestContext {
  public readonly auth: Auth;
  public readonly body: Body;
  public readonly headers: Headers;
  public readonly logger: Logger;
  public readonly method: string;
  public readonly params: Params;
  public readonly path: string;
  public readonly query: Query;
  public readonly session: Session;
  public readonly url: Url;

  private _old: Old;

  constructor(
    public readonly req: Request,
    public readonly res: Response,
    private readonly routeMapper: RouteMapper,
    private readonly staticPath?: string,
  ) {
    this.auth = new Auth(req);
    this.body = req.body = new Body(req.body || {});
    this.headers = new Headers(req.headers);
    this.method = req.method;
    this.params = new Params(req.params || {});
    this.path = req.path;
    this.query = new Query(req.query || {});
    this.session = new Session(req);
    this.url = new Url(
      req,
      res,
      this.session,
      this.body,
      this.staticPath,
      this.routeMapper,
    );
    this.logger = req.logger;
  }

  // this is a trick to initialize old the first time it's requested
  // rather than when the context is initialized
  get old(): Old {
    if (this._old) {
      return this._old;
    }
    // get old input
    const [oldInput] = this.session.getFlash('__old__');
    let old;
    if (oldInput) {
      try {
        old = new Old(JSON.parse(oldInput));
      } catch (err) {
        this.logger.debug('failed to parse old input');
        return this._old;
      }
    }
    this._old = new Old(old);
    return this._old;
  }

  csrfToken() {
    return this.req.csrfToken();
  }

  csrfField() {
    return `<input type="hidden" style="display: none; tab-index: -1;" value="${this.csrfToken()}" name="_csrf" />`;
  }

  status(status: number) {
    this.res.status(status);
  }
}
