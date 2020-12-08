export const enum RequestMethod {
  GET = 'get',
  POST = 'post',
  DELETE = 'delete',
  PUT = 'put',
  PATCH = 'patch',
  OPTIONS = 'options',
  HEAD = 'head',
}

export const enum STORAGE {
  REQ_KEY = '__REQ_KEY__',
  TRANSACTION_KEY = '__TRANSACTION_KEY__',
}

export const PATH_METADATA = '__PATH_METADATA__';
export const PATH_OPTION_METADATA = '__PATH_OPTION_METADATA__';
export const METHOD_METADATA = '__METHOD_METADATA__';
export const ROUTES_METADATA = '__ROUTES_METADATA__';
export const CONTROLLER_MIDDLEWARE_METADATA =
  '__CONTROLLER_MIDDLEWARE_METADATA__';
export const MIDDLEWARE_METADATA = '__METHOD_MIDDLEWARE_METADATA__';
export const PARAMETER_RESOLVER_METADATA = '__PARAM_RESOLVER_METADATA__';
