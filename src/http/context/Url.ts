import { Request, Response } from 'express';
import { RouteMapper, METHOD, IQuery } from '../../routing/RouteMapper';
import { Body } from './Req';
import { Session } from './Session';
import { join, parse } from 'path';
import { readdirSync } from 'fs';

export class Url {
  private readonly dirMap: Map<string, string[]>;

  constructor(
    private readonly req: Request,
    private readonly res: Response,
    private readonly session: Session,
    private readonly body: Body,
    private readonly staticPath: string,
    private readonly routeMapper: RouteMapper,
  ) {
    this.dirMap = new Map();
  }

  public alias(name: string, params?: object, query?: IQuery, method?: METHOD) {
    return this.routeMapper.construcUrl(name.split('/'), params, query, method);
  }

  public url(name: string, params?: object, query?: IQuery, method?: METHOD) {
    return this.routeMapper.construcUrl(name.split('/'), params, query, method);
  }

  /**
   * @param path a asset path relative to the static path defined in the app config
   */
  public asset(path: string) {
    const absPath = join(this.staticPath, path);
    const { dir, base } = parse(absPath);
    if (base.indexOf('[hash]')) {
      const directoryContents = readdirSync(dir);
      this.dirMap.set(dir, directoryContents);
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

  back() {
    this.session.flash('__old__', JSON.stringify(this.body.getOriginal()));
    this.res.redirect(302, this.req.get('Referrer'));
  }
}
