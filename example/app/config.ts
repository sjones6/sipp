import { IAppConfig } from '@src/index';

export const config: IAppConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  port: 4000,
  session: {
    secret: process.env.SESSION_SECRET || 'keyboard cat',
  },
  csrf: {
    cookie: true,
  },
  static: 'public',
};
