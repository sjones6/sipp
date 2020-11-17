import { PARAMETER_METADATA, PARAMS } from '../constants';

const makeParam = (key) => {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) => {
    const existingParams: any[] =
      Reflect.getOwnMetadata(PARAMETER_METADATA, target, propertyKey) || [];
    existingParams.push(key);
    Reflect.defineMetadata(
      PARAMETER_METADATA,
      existingParams,
      target,
      propertyKey,
    );
  };
};

const makeModelParam = (key) => (Model) => {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) => {
    const paramConfigs: object =
      Reflect.getOwnMetadata(PARAMETER_METADATA, target) || {};
    const existingParams = paramConfigs[propertyKey] || [];
    existingParams.push({
      key,
      Model,
    });
    paramConfigs[propertyKey] = existingParams;
    Reflect.defineMetadata(PARAMETER_METADATA, paramConfigs, target);
  };
};

export const Body = makeParam(PARAMS.BODY);
export const Create = makeModelParam(PARAMS.CREATE);
export const Resolve = makeModelParam(PARAMS.GET);
