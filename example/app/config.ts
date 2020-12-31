import { IAppConfig } from '@src/index';

export const config: IAppConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  port: 4000,
  middleware: {
    static: {
      path: 'public',
    },
    session: {
      secret: process.env.SESSION_SECRET || 'keyboard cat',
    },
    csrf: {
      cookie: true,
    },
    body: {
      limit: '1mb',
    },
  },
};
