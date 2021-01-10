import {
  HTTPRedirect,
  HTTPResponse,
  toResponse,
  ResponseHeaders,
  ResponseBody,
} from './index';
import { Download, Downloadable } from './download';
import { ReadStream } from 'fs';

export class HTTPResponder {
  /**
   * Create an HTTP Response recognized by the Sipp framework.
   *
   * @param response the HTTP response
   * @param headers (optional) headers to set on the reply
   * @param status (optional) status code
   */
  public reply(
    response: ResponseBody,
    headers?: ResponseHeaders,
    status?: number,
  ): Promise<HTTPResponse<any>> {
    return toResponse(response, headers, status);
  }

  /**
   * Return a redirect response
   *
   * @param path    path to which to redirect
   * @param status  status code
   */
  protected redirect(
    path: string,
    status: 302 | 301 = 302,
    headers?: ResponseHeaders,
  ): HTTPRedirect {
    return new HTTPRedirect(path, headers, status);
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
