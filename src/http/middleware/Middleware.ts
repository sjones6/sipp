import { HTTPResponse } from '../response';
import { HTTPResponder } from '../response/Responder';

export class Middleware extends HTTPResponder {
  public bind() {
    return this.handle.bind(this);
  }
  // @ts-ignore
  public async handle(...args: any[]): Promise<void | HTTPResponse<any>> {}
}
