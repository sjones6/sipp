import { RouteMapper, METHOD, IQuery } from '../../routing/RouteMapper';
import { join, parse } from 'path';
import { readdirSync } from 'fs';

/**
 * @class
 */
export class Url {
  constructor(
    private readonly staticPath: string,
    private readonly routeMapper: RouteMapper,
  ) {}

  /**
   * Resolve a route alias into a qualified URL
   * 
   * @param name alias name
   * @param params route params to splice into the route
   * @param query something that can be stringified into query params
   * @param method method to append if not POST or GET
   */
  public alias(name: string, params?: object, query?: IQuery, method?: METHOD) {
    return this.routeMapper.resolve(name, params, query, method);
  }

  /**
   * Construct an arbitrary url
   * 
   * @param relativeUrl a url (not including protocol)
   * @param params route params to splice into the route
   * @param query something that can be stringinfied as a query
   * @param method enum of a method to append (for the method-rewriting)
   * 
   * @return the qualified url
   */
  public url(relativeUrl: string, params?: object, query?: IQuery, method?: METHOD) {
    return this.routeMapper.construcUrl(relativeUrl.split('/'), params, query, method);
  }

  /**
   * @param path a asset path relative to the static path defined in the app config
   */
  public asset(path: string) {
    const absPath = join(this.staticPath, path);
    const { dir, base } = parse(absPath);
    if (base.indexOf('[hash]')) {
      const directoryContents = readdirSync(dir);
      const parts = base.split('[hash]');
      const re = new RegExp(`^${parts[0]}.+${parts[1]}$`);
      const hashedFile = directoryContents.find((filePath) =>
        re.test(filePath),
      );
      return hashedFile || path;
    }
    return path;
  }

  /**
   * @param path a asset path relative to the static path defined in the app config
   * @param defer
   * @return a fully constructed script tag
   */
  scriptTag(filePath: string, defer: boolean = true): string {
    let scriptPath = filePath;
    if (!filePath.startsWith('http')) {
      const { base } = parse(filePath);
      const jsUrl = this.asset(`${base}.js`);
      const { dir, name } = parse(jsUrl);
      scriptPath = `${dir.replace(this.staticPath, '')}${name}.js`;
    }
    return `<script src="${scriptPath}" ${defer ? 'defer' : ''}></script>`;
  }

  /**
   * @param path a asset path relative to the static path defined in the app config
   * @return a fully constructed style tag
   */
  styleTag(filePath: string) {
    let stylePath = filePath;
    if (!filePath.startsWith('http')) {
      const { base } = parse(filePath);
      const csUrl = this.asset(`${base}.css`);
      const { dir, name } = parse(csUrl);
      stylePath = `${dir.replace(this.staticPath, '')}${name}.css`;
    }
    return `<link rel="stylesheet" href="${stylePath}">`;
  }
}
