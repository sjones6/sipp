import { BaseException } from './BaseException';

export class ParamNotResolveable extends BaseException {
  public getDescription() {
    return `The parameter could not be resolved. Make sure that all parameter Types are classes (not TS interfaces) and have registered resolvers.`;
  }
}
