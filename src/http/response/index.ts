import mime from 'mime-types';
import { Request, Response } from 'express';
import { PathDownload, StreamDownload } from './download';

export type ResponseBody = string | undefined | null | object | Array<any>;

export class HTTPResponse<ResponseType> {
  protected mimeType: string | undefined = mime.lookup('txt');
  protected headers: object | undefined;
  constructor(
    protected readonly controllerResponse: ResponseType,
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
    req: Request,
    res: Response,
  ): HTTPResponse<StreamDownload | PathDownload> {
    this.controllerResponse.handle(res);
    return this;
  }
}
