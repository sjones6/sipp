import { BaseException } from './BaseException';

export class BadRequestException extends BaseException {
  public readonly code = 400;
}

export class NotFoundException extends BaseException {
  public readonly code = 404;
}
