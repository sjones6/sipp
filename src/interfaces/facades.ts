import { HTTPResponse } from '../http';
import { RequestContext } from '../RequestContext';

export interface IHTTPResponseFacade {
  (ctx: RequestContext): HTTPResponse;
}
