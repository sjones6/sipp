import {
  PATH_METADATA,
  METHOD_METADATA,
  ROUTES_METADATA,
  RequestMethod,
  PATH_OPTION_METADATA,
} from '../constants';
import { withParamProviding } from './Provide';

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

    descriptor.value = withParamProviding(descriptor.value, target, key);

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
