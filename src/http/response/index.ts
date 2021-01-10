import mime from 'mime-types';
import { Request, Response } from 'express';
import { PathDownload, StreamDownload, Download } from './download';
import { View } from '../view';
import { isInstanceOf } from '../../utils';

export type ResponseBody =
  | string
  | undefined
  | null
  | object
  | Array<any>
  | View;

export type ResponseHeaders = {
  [key: string]: string;
};

export class HTTPResponse<ResponseType> {
  protected mimeType: string | undefined = mime.lookup('txt');
  protected defaultHeaders: object | undefined;
  constructor(
    protected readonly controllerResponse: ResponseType,
    protected readonly headers?: ResponseHeaders,
    protected readonly status?: number,
  ) {}
  public handle(req: Request, res: Response): void {
    this.setStatus(req, res)
      .setHeaders(req, res)
      .setMimeType(req, res)
      .setBody(req, res);
  }
  protected setBody(req: Request, res: Response): HTTPResponse<ResponseType> {
    res.send(this.controllerResponse);
    return this;
  }
  protected setStatus(req: Request, res: Response): HTTPResponse<ResponseType> {
    if (this.status) {
      res.status(this.status);
    } else {
      if (/post/i.test(req.method)) {
        res.status(201);
      } else {
        res.status(200);
      }
    }
    return this;
  }
  protected setHeaders(
    req: Request,
    res: Response,
  ): HTTPResponse<ResponseType> {
    if (this.defaultHeaders) {
      Object.keys(this.defaultHeaders).forEach((headerName) => {
        res.setHeader(headerName, this.defaultHeaders[headerName]);
      });
    }
    if (this.headers) {
      Object.keys(this.headers).forEach((headerName) => {
        res.setHeader(headerName, this.headers[headerName]);
      });
    }
    return this;
  }
  protected setMimeType(
    req: Request,
    res: Response,
  ): HTTPResponse<ResponseType> {
    this.mimeType && res.set('Content-Type', this.mimeType);
    return this;
  }
}

export class HTTPRedirect extends HTTPResponse<string> {
  protected readonly status: number = 302;
  public handle(req: Request, res: Response) {
    res.redirect(this.status, this.controllerResponse);
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
  constructor(content = undefined, headers = undefined) {
    super(content, headers, 204);
  }
}

export class DownloadResponse extends HTTPResponse<
  StreamDownload | PathDownload
> {
  constructor(
    download: StreamDownload | PathDownload,
    headers?: ResponseHeaders,
    status?: number,
  ) {
    super(download, headers, status || 200);
    this.mimeType = mime.contentType(download.mimeType) as string;
    this.defaultHeaders = {
      'Content-Disposition': `attachment; filename="${download.getFileName()}"`,
    };
  }
  protected setBody(
    req: Request,
    res: Response,
  ): HTTPResponse<StreamDownload | PathDownload> {
    this.controllerResponse.handle(res);
    return this;
  }
}

export async function toResponse(
  response: any,
  headers?: ResponseHeaders,
  status?: number,
): Promise<HTTPResponse<any>> {
  // theoretically possible to return a HTTPResponse object from the controller. No need to coerce
  if (isInstanceOf(HTTPResponse, response)) {
    return response;
  }

  switch (true) {
    case response == null: // null or undefined
      return new NoContentResponse(undefined, headers);
    case response instanceof Download:
      return new DownloadResponse(response, headers, status);
    case response instanceof View:
    case response.prototype instanceof View:
      return new HTMLResponse(await response.renderToHtml(), headers, status);
    case typeof response === 'string': // either html or plain text
    case response instanceof String:
      return response.startsWith('<') && response.endsWith('>')
        ? new HTMLResponse(response, headers, status)
        : new HTTPResponse(response, headers, status);
    case typeof response == 'object': // json
    case Array.isArray(response):
      return new JSONResponse(response, headers, status);
    default:
      return new HTTPResponse(response, headers, status);
  }
}
