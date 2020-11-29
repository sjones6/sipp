import { IMiddlewareFunc } from '../interfaces';
import {
  CONTROLLER_MIDDLEWARE_METADATA,
  MIDDLEWARE_METADATA,
} from '../constants';

export const Apply = (
  ...middleware: IMiddlewareFunc[]
): MethodDecorator => {
  return function (
    target: object | Function,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ): void {
    Reflect.defineMetadata(MIDDLEWARE_METADATA, middleware, target, key);
  };
};

export const ControllerMiddleware = (
  ...middleware: IMiddlewareFunc[]
): ClassDecorator => {
  return function (constructor: Function): void {
    Reflect.defineMetadata(
      CONTROLLER_MIDDLEWARE_METADATA,
      middleware,
      constructor,
    );
  };
};
