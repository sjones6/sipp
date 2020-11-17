import { HTTPResponse } from '../http';
import { IRequestContext } from './request';

export interface IHTTPResponseFacade {
  (ctx: IRequestContext): HTTPResponse;
}
