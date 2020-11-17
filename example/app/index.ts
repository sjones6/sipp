import 'module-alias/register';
import { App } from '@src/index';
import controllers from './controllers';
import { config } from './config';

App.bootstrap(config).withControllers(controllers).listen();
