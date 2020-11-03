import { PATH_METADATA, METHOD_METADATA, ROUTES_METADATA, RequestMethod } from "../constants";

export interface RequestMappingMetadata {
  [PATH_METADATA]?: string | string[];
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
  const requestMethod = metadata[METHOD_METADATA] || RequestMethod.GET;

  return (
    target: object,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) => {
    const ROUTES = Reflect.getMetadata(ROUTES_METADATA, target) || {};
    ROUTES[key] = 1;
    Reflect.defineMetadata(ROUTES_METADATA, ROUTES, target);
    Reflect.defineMetadata(PATH_METADATA, path, descriptor.value);
    Reflect.defineMetadata(METHOD_METADATA, requestMethod, descriptor.value);
    return descriptor;
  };
};

const createMappingDecorator = (method: RequestMethod) => (
  path?: string | string[],
): MethodDecorator => {
  return RequestMapping({
    [PATH_METADATA]: path,
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
