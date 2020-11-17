import { IRequestContext } from '../interfaces';
import { HTTPResponse } from './HTTPResponse';
import { MIME_TYPES } from './mime';

export class HTMLResponse extends HTTPResponse {
  protected readonly mimeType: string = MIME_TYPES.HTML;
  protected view;
  static withView<T>(
    view: Function,
    ctx: IRequestContext,
    data: T,
    status?: number,
  ): HTMLResponse {
    const res = new HTMLResponse(ctx, data, status);
    res.setView(view);
    return res;
  }
  public setView(view) {
    this.view = view;
  }
  protected setBody() {
    this.ctx.res.send(this.view(this.controllerResponse));
  }
}
