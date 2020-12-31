import queryString, { StringifiableRecord } from 'query-string';

export type METHOD = 'put' | 'patch' | 'delete';

export interface IQuery extends StringifiableRecord {
  _method?: METHOD;
}

export class RouteMapper {
  private readonly aliasMap: Map<
    string | Symbol,
    [string[], METHOD | undefined]
  >;
  constructor() {
    this.aliasMap = new Map();
  }

  public register(alias: string | Symbol, path: string, method?: METHOD) {
    if (this.aliasMap.has(alias)) {
      throw new Error(`Conflict ${alias} already registered`);
    }
    const isOverrideableMethod = ['put', 'patch', 'delete'].includes(method);
    this.aliasMap.set(alias, [
      this.createPath(path.split('/')),
      isOverrideableMethod ? method : undefined,
    ]);
  }

  public has(name: string | Symbol): boolean {
    return this.aliasMap.has(name);
  }

  public spliceParams(parts: string[], params: {}): string {
    return parts.reduce((path, part) => {
      if (part.startsWith(':')) {
        const paramValue = params[part.replace(':', '')];
        return path + '/' + (paramValue !== undefined ? paramValue : part);
      }
      return part ? path + '/' + part : path;
    }, '');
  }

  public appendQuery(path: string, query?: IQuery) {
    if (!query) {
      return path;
    }
    return `${path.replace(/\??$/, '?')}${queryString.stringify(query)}`;
  }

  public resolve(
    name: string | Symbol,
    params?: object,
    query?: IQuery,
    method?: METHOD,
  ): string {
    if (!this.has(name)) {
      throw new Error(`Not Found: ${name} not registered`);
    }
    const [path, routeMethod] = this.aliasMap.get(name);
    return this.construcUrl(path, params, query, method || routeMethod);
  }

  public construcUrl(
    parts: string[],
    params?: object,
    query?: IQuery,
    method?: METHOD,
  ) {
    let route: string = this.spliceParams(parts, params || {});

    if (method) {
      query = query || {};
      query._method = method;
    }
    return this.appendQuery(route, query);
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
