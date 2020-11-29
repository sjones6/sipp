import queryString, { StringifiableRecord } from 'query-string';

export interface IQuery extends StringifiableRecord {
  _method?: string;
}

function isObject(maybeObject) {
  return maybeObject && typeof maybeObject === 'object';
}

export class RouteMapper {
  private readonly aliasMap: Map<string | Symbol, string[]>;
  constructor() {
    this.aliasMap = new Map();
  }

  public register(alias: string | Symbol, path: string) {
    if (this.aliasMap.has(alias)) {
      throw new Error(`Conflict ${alias} already registered`);
    }
    this.aliasMap.set(alias, this.createPath(path.split('/')));
  }

  public resolve(
    name: string | Symbol,
    params?: object,
    query?: IQuery,
    method?: string,
  ): string {
    if (!this.aliasMap.has(name)) {
      throw new Error(`Not Found: ${name} not registered`);
    }

    let route: string = this.aliasMap.get(name).reduce((path, part) => {
      if (part.startsWith(':') && isObject(params)) {
        const paramValue = params[part.replace(':', '')];
        return path + '/' + (paramValue !== undefined ? paramValue : part);
      }
      return part ? path + '/' + part : path;
    }, '');

    if (method) {
      query = query || {};
      query._method = method;
    }
    if (query) {
      // todo: need to decide on array string method
      route = route + '?' + queryString.stringify(query);
    }

    return route;
  }

  private createPath(path: string[]): string[] {
    const pathParts = [];
    path.forEach((part) => {
      part.split('/').forEach((partial) => {
        partial && pathParts.push(this.stripSlashes(partial));
      });
    });
    return pathParts;
  }

  private stripSlashes(str: string) {
    return str.replace(/^\/?(.*)\/?$/, '$1');
  }
}
