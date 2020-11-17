import { PARAMETER_METADATA, PARAMS } from '../constants';

function makeParam<T>(key) {
  return (arg: T) => {
    return (
      target: Object,
      propertyKey: string | symbol,
      parameterIndex: number,
    ) => {
      const existingParams: any[] =
        Reflect.getOwnMetadata(PARAMETER_METADATA, target, propertyKey) || [];
      existingParams[parameterIndex] = { key, arg };
      Reflect.defineMetadata(
        PARAMETER_METADATA,
        existingParams,
        target,
        propertyKey,
      );
    };
  };
}

export const Body = makeParam<void>(PARAMS.BODY);
export const Ctx = makeParam<void>(PARAMS.CTX);
export const Param = makeParam<string>(PARAMS.PARAM);
export const Req = makeParam<void>(PARAMS.REQ);
export const Res = makeParam<void>(PARAMS.RES);
export const Session = makeParam<void>(PARAMS.SESSION);
