import { App } from '../src';
import controllers from './controllers';
import { config } from './config'

App.bootstrap(config)
  .withControllers(controllers)
  .listen();