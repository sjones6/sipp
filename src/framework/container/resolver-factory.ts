import { Resolver, RESOLVER_KEY } from './Resolver';

import {
  Body,
  Headers,
  Old,
  Params,
  Query,
  RequestContext,
  Session,
  Url,
} from '../../http';
import { Model } from '../../db';
import { RequestMethod } from '../../constants';
import { Logger } from '../../logger';

export { RESOLVER_KEY };

async function resolveModel(ctx: RequestContext, Type: any): Promise<Model> {
  const requestMethod = ctx.method;
  let model;
  switch (requestMethod) {
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
}

export function resolverFactory(): Resolver {
  const resolver = new Resolver();

  // override-able types
  resolver.addResolver<Body>(Body, (ctx: RequestContext, Type) => {
    return Type !== Body ? new Type(ctx.body) : ctx.body;
  });
  resolver.addResolver<Headers>(Headers, (ctx: RequestContext, Type) => {
    return Type !== Headers ? new Type(ctx.headers) : ctx.headers;
  });
  resolver.addResolver<Params>(Params, (ctx: RequestContext, Type) => {
    return Type !== Params ? new Type(ctx.params) : ctx.params;
  });
  resolver.addResolver<Query>(Query, (ctx: RequestContext, Type) => {
    return Type !== Query ? new Type(ctx.query) : ctx.query;
  });

  resolver.addResolver<Old>(Old, (ctx: RequestContext, Type) => ctx.old);
  resolver.addResolver<Url>(Query, (ctx: RequestContext) => ctx.url);
  resolver.addResolver<Session>(Query, (ctx: RequestContext) => ctx.session);
  resolver.addResolver<Model>(Query, resolveModel);
  resolver.addResolver<Logger>(Logger, (ctx: RequestContext) => ctx.logger);
  resolver.addResolver<RequestContext>(RequestContext, (ctx: RequestContext) => ctx);

  return resolver;
}
