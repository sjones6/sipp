import 'module-alias/register';
import { App } from '@src/index';
import controllers from './controllers';
import { config } from './config';
import { FooServiceProvider } from './providers/FooServiceProvider';
import { ViewServiceProvider } from './providers/ViewServiceProvider';

const app = App.bootstrap(config);

app.withControllers(...controllers).withProviders(new FooServiceProvider(), new ViewServiceProvider());

app.wire().then(() => {
  app.listen();
});
