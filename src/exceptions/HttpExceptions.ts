import { BaseException } from './BaseException';

export class BadRequestException extends BaseException {
  public readonly code = 400;
}

export class UnauthorizedException extends BaseException {
  public readonly code = 401;
}

export class PaymentRequiredException extends BaseException {
  public readonly code = 402;
}

export class ForbiddenException extends BaseException {
  public readonly code = 402;
}

export class NotFoundException extends BaseException {
  public readonly code = 404;
}

export class MethodNotAllowedException extends BaseException {
  public readonly code = 405;
}

export class NotAcceptableException extends BaseException {
  public readonly code = 406;
}

export class ProxyAuthenticationRequiredException extends BaseException {
  public readonly code = 407;
}

export class RequestTimeoutException extends BaseException {
  public readonly code = 408;
}

export class ConflictException extends BaseException {
  public readonly code = 409;
}

export class GoneException extends BaseException {
  public readonly code = 410;
}

export class LengthRequiredException extends BaseException {
  public readonly code = 411;
}

export class PreconditionFailedException extends BaseException {
  public readonly code = 412;
}

export class PayloadTooLargeException extends BaseException {
  public readonly code = 413;
}

export class UriTooLongException extends BaseException {
  public readonly code = 414;
}

export class UnsupportedMediaTypeException extends BaseException {
  public readonly code = 415;
}

export class RangeNotSatisfiableException extends BaseException {
  public readonly code = 416;
}

export class ExpectationFailedException extends BaseException {
  public readonly code = 417;
}

export class ImATeapotException extends BaseException {
  public readonly code = 418;
}

export class MisdirectedRequestException extends BaseException {
  public readonly code = 421;
}

export class UnprocessableEntityException extends BaseException {
  public readonly code = 422;
}

export class LockedException extends BaseException {
  public readonly code = 423;
}

export class FailedDependencyException extends BaseException {
  public readonly code = 424;
}

export class TooEarlyException extends BaseException {
  public readonly code = 425;
}

export class UpgradeRequiredException extends BaseException {
  public readonly code = 426;
}

export class PreconditionRequiredException extends BaseException {
  public readonly code = 428;
}

export class TooManyRequestsException extends BaseException {
  public readonly code = 428;
}

export class RequestHeaderFieldsTooLargeException extends BaseException {
  public readonly code = 431;
}

export class UnavailableForLegalReasonsException extends BaseException {
  public readonly code = 451;
}

// 500s
export class InternalServerException extends BaseException {
  public readonly code = 500;
}

export class NotImplementedException extends BaseException {
  public readonly code = 501;
}

export class BadGatewayException extends BaseException {
  public readonly code = 502;
}

export class ServiceUnavailableException extends BaseException {
  public readonly code = 503;
}

export class GatewayTimeoutException extends BaseException {
  public readonly code = 504;
}

export class HTTPVersionNotSupportedException extends BaseException {
  public readonly code = 505;
}

export class VariantAlsoNegatesException extends BaseException {
  public readonly code = 506;
}

export class InsufficientStorageException extends BaseException {
  public readonly code = 507;
}

export class LoopDetectedException extends BaseException {
  public readonly code = 508;
}

export class NotExtendedException extends BaseException {
  public readonly code = 510;
}

export class NetworkAuthenticationRequiredException extends BaseException {
  public readonly code = 511;
}
