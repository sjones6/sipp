import { join } from 'path';
import { IAppConfig } from '../../interfaces';

export const loadConfig = (configFlag?: string): { config: IAppConfig } => {
  if (configFlag) {
    return require(join(process.cwd(), configFlag));
  }

  let app = {
    config: './dist/config',
  };
  try {
    const pkg = require(join(process.cwd(), 'package.json'));
    if (pkg && pkg.app) {
      Object.assign(app, pkg.app);
    }
  } catch (err) {
    // swallow - no pkg json.
    console.error(`could not load package.json, not fatal. Continuing`);
  }
  return require(join(process.cwd(), app.config));
};
