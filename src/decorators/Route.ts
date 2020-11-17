import {
  PATH_METADATA,
  METHOD_METADATA,
  ROUTES_METADATA,
  RequestMethod,
  PARAMETER_METADATA,
  PARAMS,
  PATH_OPTION_METADATA,
} from '../constants';
import { RequestContext } from '../RequestContext';

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
      const paramMetadata =
        Reflect.getMetadata(PARAMETER_METADATA, target, key) || [];
      if (paramMetadata.length) {
        const realArgs = [];
        const ctx: RequestContext = arguments[0];
        for (let i = 0, n = paramMetadata.length; i < n; i++) {
          const param = paramMetadata[i];
          switch (param.key || param) {
            case PARAMS.BODY:
              realArgs.push(ctx.body || {});
              break;
            case PARAMS.CTX:
              realArgs.push(ctx);
              break;
            case PARAMS.REQ:
              realArgs.push(ctx.req);
              break;
            case PARAMS.REQ:
              realArgs.push(ctx.res);
              break;
            case PARAMS.PARAM:
              realArgs.push(ctx.params ? ctx.params[param.arg] : undefined);
              break;
            case PARAMS.SESSION:
              realArgs.push(ctx.session);
              break;
          }
        }
        return method.apply(this, realArgs);
      }
      return method.apply(this, arguments);
    };

    Reflect.defineMetadata(ROUTES_METADATA, ROUTES, target);
    Reflect.defineMetadata(PATH_METADATA, path, descriptor.value);
    Reflect.defineMetadata(METHOD_METADATA, requestMethod, descriptor.value);

    if (pathOptionMetadata) {
      Reflect.defineMetadata(
        PATH_OPTION_METADATA,
        pathOptionMetadata,
        descriptor.value,
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
