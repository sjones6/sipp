import { Controller } from '../Controller';
import { ServiceProvider } from '../framework/services/ServiceProvider';
import { ServiceRegistry } from '../framework/container/ServiceRegistry';

import {
  Body,
  Headers,
  Old,
  Params,
  Query,
  RequestContext,
  Session,
  Url,
  View,
} from '../http';
import { Logger } from '../logger';

export class ParamResolutionProvider extends ServiceProvider {
  public register(registry: ServiceRegistry): void {
    registry.registerFor<Body>(
      [Controller, View],
      Body,
      (ctx: RequestContext) => ctx.body,
    );
    registry.registerFor<Headers>(
      [Controller, View],
      Headers,
      (ctx: RequestContext) => ctx.headers,
    );
    registry.registerFor<Params>(
      [Controller, View],
      Params,
      (ctx: RequestContext) => ctx.params,
    );
    registry.registerFor<Query>(
      [Controller, View],
      Query,
      (ctx: RequestContext) => ctx.query,
    );
    registry.registerFor<Old>(
      [Controller, View],
      Old,
      (ctx: RequestContext) => ctx.old,
    );
    registry.registerFor<Url>(
      [Controller, View],
      Url,
      (ctx: RequestContext) => ctx.url,
    );
    registry.registerFor<Session>(
      [Controller, View],
      Session,
      (ctx: RequestContext) => ctx.session,
    );
    registry.registerFor<Logger>(
      [Controller, View],
      Logger,
      (ctx: RequestContext) => ctx.logger,
    );
  }
}
