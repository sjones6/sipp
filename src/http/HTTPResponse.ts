import { RequestContext } from '../RequestContext';
import { MIME_TYPES } from './mime';

export class HTTPResponse {
  protected readonly mimeType: string = MIME_TYPES.TEXT;
  constructor(
    protected readonly ctx: RequestContext,
    protected readonly controllerResponse: any,
    protected readonly status: number = 200,
  ) {}
  public handle() {
    this.setStatus();
    this.setMimeType();
    this.setBody();
  }
  protected setBody() {
    this.ctx.res.send(this.controllerResponse);
  }
  private setStatus() {
    this.ctx.res.status(this.status);
  }
  private setMimeType() {
    this.ctx.res.set('Content-Type', this.mimeType);
  }
}
