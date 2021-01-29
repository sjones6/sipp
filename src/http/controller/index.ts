import { BaseException } from '../../exceptions';
import { ResponseBody } from '..';
import { HTTPResponder } from '../response/Responder';
import { Request, Response } from 'express';

const standardize = (path) =>
path
  .replace(/([A-Z])/g, ' $1') // replace all caps with space before
  .replace(/[^A-Za-z0-9]/g, ' ') // replace non alpha-number with space before
  .replace(/\s{1,}/g, '-') // convert all spaces to -
  .replace(/^\-|[\-]$/g, '') // slice - at the start and end
  .toLowerCase();

export class Controller extends HTTPResponder {
  public readonly basePath: string | null = null;

  public getBasePath(): string {
    if (this.basePath !== null) {
      if (/[^\w\/-]/.test(this.basePath)) {
        throw new Error(`${this.constructor.name}'s basePath contains illegal characters: ${this.basePath}.`);
      }
      return this.basePath.toLowerCase();
    }
    return standardize(this.constructor.name.replace('Controller', '')); // strip out controller
  }

  /**
   * Handle errors thrown when the controller is handling requests
   */
  public onException(
    // @ts-ignore
    e: BaseException,
    // @ts-ignore
    req: Request,
    // @ts-ignore
    res: Response,
  ): false | ResponseBody | Promise<false | ResponseBody> {
    return false;
  }
}
