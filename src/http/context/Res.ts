import { Request, Response } from 'express';

/**
 * @class Res
 * 
 * Res is a lightweight wrapper around express.Response with a few
 * additional convenience wrappers.
 * 
 * Res can be injected via type-hint
 */
export class Res {
  constructor(private readonly req: Request, private readonly res: Response) {}

  get(headerField: string) {
    return this.res.get(headerField);
  }

  back() {
    this.res.redirect(302, this.req.get('Referrer'));
  }

  status(code: number) {
    this.res.status(code);
  }
}
