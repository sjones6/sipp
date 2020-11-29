import { RequestContext } from '../context/RequestContext';
import mime from 'mime-types';
import { PathDownload, StreamDownload } from './download';

export type ResponseBody = string | undefined | null | object | Array<any>;

export class HTTPResponse<ResponseType> {
  protected mimeType: string | undefined = mime.lookup('txt');
  protected headers: object | undefined;
  constructor(
    protected readonly controllerResponse: ResponseType,
    protected readonly status?: number,
  ) {}
  public handle(ctx: RequestContext): void {
    this.setStatus(ctx).setHeaders(ctx).setMimeType(ctx).setBody(ctx);
  }
  protected setBody(ctx: RequestContext): HTTPResponse<ResponseType> {
    ctx.res.send(this.controllerResponse);
    return this;
  }
  protected setStatus(ctx: RequestContext): HTTPResponse<ResponseType> {
    if (this.status) {
      ctx.res.status(this.status);
    } else {
      if (/post/i.test(ctx.method)) {
        ctx.res.status(201);
      } else {
        ctx.res.status(200);
      }
    }
    return this;
  }
  protected setHeaders(ctx: RequestContext): HTTPResponse<ResponseType> {
    if (this.headers) {
      Object.keys(this.headers).forEach((headerName) => {
        ctx.res.setHeader(headerName, this.headers[headerName]);
      });
    }
    return this;
  }
  protected setMimeType(ctx: RequestContext): HTTPResponse<ResponseType> {
    this.mimeType && ctx.res.set('Content-Type', this.mimeType);
    return this;
  }
}

export class HTTPRedirect extends HTTPResponse<string> {
  protected readonly status: number = 302;
  public handle(ctx: RequestContext) {
    ctx.res.redirect(this.status, this.controllerResponse);
  }
}

export class JSONResponse extends HTTPResponse<object | Array<any>> {
  protected readonly mimeType: string = mime.lookup('json');
}

export class HTMLResponse extends HTTPResponse<string> {
  protected readonly mimeType: string = mime.lookup('html');
}

export class NoContentResponse extends HTTPResponse<undefined> {
  protected readonly mimeType: undefined;
  constructor() {
    super(undefined, 204);
  }
}

export class DownloadResponse extends HTTPResponse<
  StreamDownload | PathDownload
> {
  constructor(download: StreamDownload | PathDownload) {
    super(download, 200);
    this.mimeType = mime.contentType(download.mimeType) as string;
    this.headers = {
      'Content-Disposition': `attachment; filename="${download.getFileName()}"`,
    };
  }
  protected setBody(
    ctx: RequestContext,
  ): HTTPResponse<StreamDownload | PathDownload> {
    this.controllerResponse.handle(ctx.res);
    return this;
  }
}
