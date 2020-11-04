import { HTTPResponse } from "./HTTPResponse";

export class HTTPRedirect extends HTTPResponse {
  protected readonly status: number = 302
  public handle() {
    this.ctx.res.redirect(this.status, this.controllerResponse);
  }
}