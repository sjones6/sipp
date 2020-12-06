import { STORAGE } from 'src/constants';
import { ParamNotResolveable } from '../exceptions/ParamNotResolveable';
import { Resolver } from '../framework/container/Resolver';
import { RequestContext } from '../http';
import { getStore } from '../utils/async-store';

export function withParamProviding(fn, target, key) {
  return async function () {
    let types = Reflect.getMetadata('design:paramtypes', target, key) || [];
    if (!types.length) {
      return fn.apply(this, arguments);
    }

    const store = getStore();
    const ctx = store.get(STORAGE.CONTEXT_KEY) as RequestContext;
    const resolver = store.get(STORAGE.RESOLVER_KEY) as Resolver;

    const realArgs = [];
    for (let i = 0, n = types.length; i < n; i++) {
      const Type = types[i];
      // an unspecified param type has a type of Object emitted in it's design:paramtypes
      const param =
        Type === Object || arguments[i] instanceof Type
          ? arguments[i]
          : await resolver.resolve(target, types[i], ctx);
      if (!param) {
        throw new ParamNotResolveable(
          `Param of ${types[i].name} could not be resolved. Be sure there is a registered resolver for this class`,
        );
      }
      realArgs.push(param);
    }
    return fn.call(this, ...realArgs);
  };
}

export const Provide = (): MethodDecorator => {
  return (
    target: object,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) => {
    descriptor.value = withParamProviding(descriptor.value, target, key);
    return descriptor;
  };
};
