import { NotFoundException } from "../exceptions";
import { PATH_METADATA, METHOD_METADATA, ROUTES_METADATA, RequestMethod, PARAMETER_METADATA, PARAMS } from "../constants";

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

    const method = descriptor.value;
    descriptor.value = async function() {
      const targetParamMetadata = Reflect.getMetadata(PARAMETER_METADATA, target) || {};
      const paramMetadata = targetParamMetadata[key] || [];
      if (paramMetadata.length) {
        const realArgs = [];
        const ctx = arguments[0];
        for (let i = 0, n = paramMetadata.length; i < n; i++) {
          const param = paramMetadata[i];
          switch (param.key || param) {
            case PARAMS.BODY:
              realArgs.push(ctx.body || {});
              break;
            case PARAMS.CREATE:
              const c = await param.Model.query().insert(ctx.body);
              realArgs.push(c);
              break;
            case PARAMS.GET:
              const modelName = param.Model.modelName();
              if (!ctx.params[modelName]) {
                throw new NotFoundException(`cannot find ${modelName}, insufficient id`);
              }
              const m = await param.Model.query().findById(ctx.params[modelName]);
              if (!m) {
                throw new NotFoundException(`cannot find ${modelName} with id ${ctx.params[modelName]}`);
              }
              realArgs.push(m);
              break;
          }
        }
        return method.apply(this, realArgs);
      }
      return method.apply(this, arguments);
    }

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
