import { BaseException } from './exceptions';
import { HTTPRedirect, ResponseBody } from './http';
import { Download, Downloadable } from './http/download';
import { RequestContext } from './RequestContext';
import { ReadStream } from 'fs';

export class Controller {
  public readonly basePath: string | null = null;

  public getBasePath(): string {
    const standardize = (path) =>
      path
        .replace(/([A-Z])/g, ' $1') // replace all caps with space before
        .replace(/[^A-Za-z0-9]/g, ' ') // replace non alpha-number with space before
        .replace(/\s{1,}/g, '-') // convert all spaces to -
        .replace(/^\-|[\-]$/g, '') // slice - at the start and end
        .toLowerCase();

    if (this.basePath !== null) {
      return standardize(this.basePath);
    }
    return standardize(this.constructor.name.replace('Controller', '')); // strip out controller
  }

  /**
   * Handle errors thrown when the controller is handling requests
   */
  public onException(
    e: BaseException,
    ctx: RequestContext,
  ): false | ResponseBody {
    return false;
  }

  /**
   * Return a redirect response
   * 
   * @param path    path to which to redirect
   * @param status  status code
   */
  protected redirect(path: string, status: 302 | 301 = 302): HTTPRedirect {
    return new HTTPRedirect(path, status);
  }

  /**
   * Return a file download response
   * 
   * @param download a downloadable asset
   * @param mimetype mimetype for the download
   * @param fileName filename for the download
   */
  protected download(
    download: Downloadable,
    fileName?: string,
    mimetype?: string,
  ): Download<string | ReadStream | Buffer> {
    return Download.from(download, mimetype, fileName);
  }
}
