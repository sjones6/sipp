import { HTTPResponder } from '../response/Responder';

export class Middleware extends HTTPResponder {
  public bind() {
    return this.handle.bind(this);
  }
  public async handle(...args: any[]): Promise<void> {}
}
