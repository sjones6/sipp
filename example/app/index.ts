import 'module-alias/register';
import { App } from '@src/index';
import controllers from './controllers';
import { config } from './config';
import { Foo } from './utils/Foo';

App.bootstrap(config)
  .withControllers(...controllers)
  .withResolver((resolver) => {
    resolver.addResolver(Foo, () => new Foo());
  })
  .listen();
