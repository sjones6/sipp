import { join } from 'path';
import { IAppConfig } from '../../interfaces';

export const loadConfig = (configFlag?: string): { config: IAppConfig } => {
  if (configFlag) {
    return require(join(process.cwd(), configFlag));
  }

  let app = {
    config: './app/config'
  }
  try {
    const pkg = require(join(process.cwd(), 'package.json'));
    if (pkg && pkg.app) {
      Object.assign(app, pkg.app);
    }
  } catch (err) {
    // swallow - no pkg json.
  }
  return require(join(process.cwd(), app.config));
}