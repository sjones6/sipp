import { Response } from 'express'
import { BaseException } from './exceptions';
import { IHTTPResponseFacade, IRequestContext } from './interfaces';

export class Controller {

  public readonly basePath: string | null = null;

  public getBasePath(): string {
    const standardize = (path) => path.replace(/([A-Z])/g, ' $1') // replace all caps with space before
      .replace(/[^A-Za-z0-9]/g, ' ') // replace non alpha-number with space before
      .replace(/\s{1,}/g, "-") // convert all spaces to -
      .replace(/^\-|[\-]$/g, '') // slice - at the start and end 
      .toLowerCase();

    if (this.basePath !== null) {
      return standardize(this.basePath);
    }
    return standardize(this.constructor.name
      .replace('Controller', '')); // strip out controller
  }

  /**
   * a generic exception handle for the controller
   */
  onException(e: BaseException, ctx: IRequestContext): Boolean | IHTTPResponseFacade {
    return false;
  }
}