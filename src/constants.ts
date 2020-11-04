
export const enum RequestMethod {
  GET = 'get',
  POST = 'post',
  DELETE = 'delete',
  PUT = 'put',
  PATCH = 'patch',
  OPTIONS = 'options',
  HEAD = 'head'
}

export enum PARAMS {
  BODY = "body",
  CREATE = "CREATE",
  GET = "GET"
}

export const PATH_METADATA = '__PATH_METADATA__';
export const METHOD_METADATA = '__METHOD_METADATA__';
export const ROUTES_METADATA = '__ROUTES_METADATA__';
export const CONTROLLER_MIDDLEWARE_METADATA = '__CONTROLLER_MIDDLEWARE_METADATA__';
export const MIDDLEWARE_METADATA = '__METHOD_MIDDLEWARE_METADATA__';
export const PARAMETER_METADATA = '__PARAMETER_METADATA__';