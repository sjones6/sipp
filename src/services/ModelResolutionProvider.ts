import { RequestContext } from '../http';
import { Controller } from '../Controller';
import { ServiceRegistry } from '../framework/container/ServiceRegistry';
import { ServiceProvider } from '../framework/services/ServiceProvider';
import { Model } from '../db';
import { RequestMethod } from '../constants';

export class ModelResolutionProvider extends ServiceProvider {
  register(registry: ServiceRegistry) {
    registry.registerFor<Model>(
      Controller,
      Model,
      async (ctx: RequestContext, Type: any, ): Promise<Model | undefined> => {
        const requestMethod = ctx.method;
        let model;
        switch (requestMethod.toLowerCase()) {
          case RequestMethod.GET:
          case RequestMethod.PATCH:
          case RequestMethod.PUT:
          case RequestMethod.DELETE:
            // look for an id in the params
            const name = Type.modelName();
            const id =
              (ctx.params[name] ? ctx.params[name] : null) || ctx.params['id'];
            model = await Type.load().findById(id);
          case RequestMethod.GET:
          case RequestMethod.DELETE:
            break;
          case RequestMethod.POST:
            model = new Type();
          case RequestMethod.PATCH:
          case RequestMethod.PUT:
          case RequestMethod.POST:
            const fillable = Type.fillable ? Type.fillable() : [];
            if (fillable.length) {
              Object.keys(ctx.body).forEach((key) => {
                if (fillable.includes(key)) {
                  model[key] = ctx.body[key];
                }
              });
            }
        }
        return (model as unknown) as Model;
      },
    );
  }
}
