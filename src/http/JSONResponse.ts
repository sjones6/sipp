import { HTTPResponse } from './HTTPResponse';
import { MIME_TYPES } from './mime';

export class JSONResponse extends HTTPResponse {
  protected readonly mimeType: string = MIME_TYPES.JSON;
}
