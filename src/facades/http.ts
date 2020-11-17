import { RequestContext } from '../RequestContext';
import {
  HTMLResponse,
  HTTPResponse,
  HTTPRedirect,
  JSONResponse,
} from '../http';
import { IHTTPResponseFacade } from '../interfaces';

interface ResponseOptions {
  status?: number;
}

interface IView<T> {
  (data: T, ctx: RequestContext): string;
}

export function view<T>(
  View: IView<T>,
  data: T,
  opt?: ResponseOptions,
): IHTTPResponseFacade {
  return (ctx: RequestContext): HTMLResponse => {
    return HTMLResponse.withView(View, ctx, data, opt && opt.status);
  };
}

export function json(
  data: object | Array<any>,
  opt?: ResponseOptions,
): IHTTPResponseFacade {
  return (ctx: RequestContext): JSONResponse => {
    return new JSONResponse(ctx, data, opt && opt.status);
  };
}

export function text(
  text?: string,
  opt?: ResponseOptions,
): IHTTPResponseFacade {
  return (ctx: RequestContext): HTTPResponse => {
    return new HTTPResponse(ctx, text, opt && opt.status);
  };
}

export function redirect(
  url?: string,
  opt?: ResponseOptions,
): IHTTPResponseFacade {
  return (ctx: RequestContext): HTTPRedirect => {
    return new HTTPRedirect(ctx, url, opt && opt.status);
  };
}
