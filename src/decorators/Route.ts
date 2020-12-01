import { Model } from '../db';
import {
  PATH_METADATA,
  METHOD_METADATA,
  ROUTES_METADATA,
  RequestMethod,
  PATH_OPTION_METADATA,
} from '../constants';
import {
  RequestContext,
  RequestSession,
  Body,
  Query,
  Headers,
  Params,
  Old,
} from '../http';
import { Logger } from '../logger';

interface PathOptions {
  name?: string;
}

export interface RequestMappingMetadata {
  [PATH_METADATA]?: string | string[];
  [PATH_OPTION_METADATA]?: PathOptions;
  [METHOD_METADATA]?: RequestMethod;
}

const defaultMetadata = {
  [PATH_METADATA]: '/',
  [METHOD_METADATA]: RequestMethod.GET,
};

function compareClasses(type1, type2): boolean {
  return (
    type1 === type2 ||
    type1.prototype instanceof type2 ||
    type1.name === type2.name
  );
}

export const RequestMapping = (
  metadata: RequestMappingMetadata = defaultMetadata,
): MethodDecorator => {
  const pathMetadata = metadata[PATH_METADATA];
  const path = pathMetadata && pathMetadata.length ? pathMetadata : '/';
  const pathOptionMetadata = metadata[PATH_OPTION_METADATA];
  const requestMethod = metadata[METHOD_METADATA] || RequestMethod.GET;

  return (
    target: object,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) => {
    const ROUTES = Reflect.getMetadata(ROUTES_METADATA, target) || {};
    ROUTES[key] = 1;

    const method = descriptor.value;
    descriptor.value = async function () {
      let types = Reflect.getMetadata('design:paramtypes', target, key) || [];
      if (!types.length) {
        return method.apply(this, arguments);
      }
      const realArgs = [];
      const ctx: RequestContext = arguments[0];
      for (let i = 0, n = types.length; i < n; i++) {
        const type = types[i];
        switch (true) {
          case compareClasses(type, Body):
            realArgs.push(type !== Body ? new type(ctx.body.raw()) : ctx.body);
            break;
          case compareClasses(type, Params):
            realArgs.push(type !== Params ? new type(ctx.params.raw()) : ctx.params);
            break;
          case compareClasses(type, Query):
            realArgs.push(type !== Query ? new type(ctx.query.raw()) : ctx.query);
            break;
          case compareClasses(type, Headers):
            realArgs.push(type !== Headers ? new type(ctx.headers.raw()) : ctx.headers);
            break;
          case compareClasses(type, RequestContext):
            realArgs.push(ctx);
            break;
          case compareClasses(type, Logger):
            realArgs.push(ctx.logger);
            break;
          case compareClasses(type, Old):
            realArgs.push(ctx.old);
            break;
          case compareClasses(type, RequestSession):
            realArgs.push(ctx.session);
            break;
          case type.prototype instanceof Model:
            let model;
            switch (requestMethod) {
              case RequestMethod.GET:
              case RequestMethod.PATCH:
              case RequestMethod.PUT:
              case RequestMethod.DELETE:
                // look for an id in the params
                const name = type.modelName();
                const id = ctx.params.has(name)
                  ? ctx.params.get(name) || ctx.params.get('id')
                  : null;
                model = await type.query().findById(id);
              case RequestMethod.GET:
              case RequestMethod.DELETE:
                break;
              case RequestMethod.POST:
                model = new type();
              case RequestMethod.PATCH:
              case RequestMethod.PUT:
              case RequestMethod.POST:
                const fillable = type.fillable ? type.fillable() : [];
                if (fillable.length) {
                  Object.keys(ctx.body.raw()).forEach((key) => {
                    if (fillable.includes(key)) {
                      model[key] = ctx.body.get(key);
                    }
                  });
                }
            }
            realArgs.push(model);
            break;
        }
      }
      return method.apply(this, realArgs);
    };

    Reflect.defineMetadata(ROUTES_METADATA, ROUTES, target);
    Reflect.defineMetadata(PATH_METADATA, path, target, key);
    Reflect.defineMetadata(METHOD_METADATA, requestMethod, target, key);

    if (pathOptionMetadata) {
      Reflect.defineMetadata(
        PATH_OPTION_METADATA,
        pathOptionMetadata,
        target,
        key,
      );
    }

    return descriptor;
  };
};

const createMappingDecorator = (method: RequestMethod) => (
  path?: string,
  options?: PathOptions,
): MethodDecorator => {
  return RequestMapping({
    [PATH_METADATA]: path,
    [PATH_OPTION_METADATA]: options,
    [METHOD_METADATA]: method,
  });
};

export const Delete = createMappingDecorator(RequestMethod.DELETE);
export const Get = createMappingDecorator(RequestMethod.GET);
export const Head = createMappingDecorator(RequestMethod.HEAD);
export const Options = createMappingDecorator(RequestMethod.OPTIONS);
export const Patch = createMappingDecorator(RequestMethod.PATCH);
export const Post = createMappingDecorator(RequestMethod.POST);
export const Put = createMappingDecorator(RequestMethod.PUT);
