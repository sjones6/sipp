import { IMiddlewareFunc } from '../interfaces';
import {
  CONTROLLER_MIDDLEWARE_METADATA,
  MIDDLEWARE_METADATA,
} from '../constants';
import { Middleware } from '../middleware';

export const Apply = (
  ...middleware: Array<IMiddlewareFunc | Middleware>
): MethodDecorator => {
  return function (
    target: object | Function,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ): void {
    Reflect.defineMetadata(MIDDLEWARE_METADATA, middleware, target, key);
  };
};

export const ApplyAll = (
  ...middleware: Array<IMiddlewareFunc | Middleware>
): ClassDecorator => {
  return function (constructor: Function): void {
    Reflect.defineMetadata(
      CONTROLLER_MIDDLEWARE_METADATA,
      middleware,
      constructor,
    );
  };
};
