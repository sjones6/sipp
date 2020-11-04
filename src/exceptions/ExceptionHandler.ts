import { BaseException } from "./BaseException";
import { IRequestContext } from "../interfaces";
import { exceptionView } from './exception';

export class ExceptionHandler {
  handle(exception: BaseException, ctx: IRequestContext): boolean {
    if (!ctx.res.headersSent) {
      ctx.res.status(exception.code);
      ctx.res.send(exceptionView(exception));
    }
    return true;
  }
}