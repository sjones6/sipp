import { Request } from 'express';

export class Csrf {
  constructor(private readonly req: Request) {}

  csrfToken() {
    return this.req.csrfToken();
  }

  csrfField() {
    return `<input type="hidden" style="display: none; tab-index: -1;" value="${this.csrfToken()}" name="_csrf" />`;
  }
}
