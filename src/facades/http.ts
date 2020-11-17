import {
  HTMLResponse,
  HTTPResponse,
  HTTPRedirect,
  JSONResponse,
} from '../http';
import { IHTTPResponseFacade, IRequestContext } from '../interfaces';

interface ResponseOptions {
  status?: number;
}

interface IView<T> {
  (data: T): string;
}

export function view<T>(
  View: IView<T>,
  data: T,
  opt?: ResponseOptions,
): IHTTPResponseFacade {
  return (ctx: IRequestContext): HTMLResponse => {
    return HTMLResponse.withView(View, ctx, data, opt && opt.status);
  };
}

export function json(
  data: object | Array<any>,
  opt?: ResponseOptions,
): IHTTPResponseFacade {
  return (ctx: IRequestContext): JSONResponse => {
    return new JSONResponse(ctx, data, opt && opt.status);
  };
}

export function text(
  text?: string,
  opt?: ResponseOptions,
): IHTTPResponseFacade {
  return (ctx: IRequestContext): HTTPResponse => {
    return new HTTPResponse(ctx, text, opt && opt.status);
  };
}

export function redirect(
  url?: string,
  opt?: ResponseOptions,
): IHTTPResponseFacade {
  return (ctx: IRequestContext): HTTPRedirect => {
    return new HTTPRedirect(ctx, url, opt && opt.status);
  };
}
