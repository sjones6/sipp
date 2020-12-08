import { registry } from '../framework/services/ServiceRegistry';

export function withParamProviding(fn, target, key) {
  return async function () {
    let types = Reflect.getMetadata('design:paramtypes', target, key) || [];
    if (!types.length) {
      return fn.apply(this, arguments);
    }

    const realArgs = [];
    for (let i = 0, n = types.length; i < n; i++) {
      const Type = types[i];
      // an unspecified param type has a type of Object emitted in it's design:paramtypes
      const param =
        Type === Object || arguments[i] instanceof Type
          ? arguments[i]
          : await registry.resolve(target, types[i]);
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
