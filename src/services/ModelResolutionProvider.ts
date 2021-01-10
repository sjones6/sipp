import { Controller } from '../http';
import { ServiceProvider } from '../framework';
import { Model } from '../db';
import { RequestMethod, STORAGE } from '../constants';
import { IServiceRegistryFn } from '../interfaces';
import { getStore } from '../utils/async-store';
import { Middleware } from '../http';
import { NotFoundException, BadRequestException } from '../exceptions';

export class ModelResolutionProvider extends ServiceProvider {
  register(register: IServiceRegistryFn) {
    register(
      [Controller, Middleware],
      Model,
      async (resolve, Type: any): Promise<Model | undefined> => {
        const req = getStore().get(STORAGE.REQ_KEY);
        const requestMethod = req.method;
        let model;
        switch (requestMethod.toLowerCase()) {
          case RequestMethod.GET:
          case RequestMethod.PATCH:
          case RequestMethod.PUT:
          case RequestMethod.DELETE:
            // look for an id in the params
            const name = Type.modelName();
            const id =
              (req.params[name] ? req.params[name] : null) || req.params['id'];
            if (!id) {
              throw new BadRequestException(
                `${Type.name} has no valid parameters; tried params.${name} and params.id`,
              );
            }
            model = await Type.load().findById(id);
            if (!model) {
              throw new NotFoundException(
                `${name} could not be located with id ${id}`,
              );
            }
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
              Object.keys(req.body).forEach((key) => {
                if (fillable.includes(key)) {
                  model[key] = req.body[key];
                }
              });
            }
        }
        return (model as unknown) as Model;
      },
    );
  }
}
