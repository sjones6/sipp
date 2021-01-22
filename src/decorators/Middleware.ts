import { IMiddlewareFunc } from '../interfaces';
import {
  CONTROLLER_MIDDLEWARE_METADATA,
  MIDDLEWARE_METADATA,
} from '../constants';
import { Middleware } from 'src/http';

const normalizeMiddleware = (middleware: IMiddlewareFunc | Middleware): IMiddlewareFunc => {
  return middleware instanceof Middleware ? middleware.bind() : middleware;
}

export const Apply = (
  ...middleware: Array<IMiddlewareFunc | Middleware>
): MethodDecorator => {
  return function (target: object | Function, key?: string | symbol): void {
    Reflect.defineMetadata(MIDDLEWARE_METADATA, middleware.map(normalizeMiddleware), target, key);
  };
};

export const ApplyAll = (
  ...middleware: Array<IMiddlewareFunc | Middleware>
): ClassDecorator => {
  return function (constructor: Function): void {
    Reflect.defineMetadata(
      CONTROLLER_MIDDLEWARE_METADATA,
      middleware.map(normalizeMiddleware),
      constructor,
    );
  };
};
