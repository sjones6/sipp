import { compareClasses } from '../../utils';
import { ParamNotResolveable } from '../../exceptions/ParamNotResolveable';
import { RequestContext } from '../../http/';
import { ServiceRegistry } from './ServiceRegistry';

export const RESOLVER_KEY = '__RESOLVER_STORAGE_KEY';

export class Resolver {
  constructor(private readonly serviceRegistry: ServiceRegistry) {}

  async resolve(obj, Type, ctx: RequestContext): Promise<any> {
    const Constructor = obj.constructor;
    const providers = this.serviceRegistry.getProvidersFor(Constructor);
    if (!providers.length) {
      throw new ParamNotResolveable(
        `Class ${Constructor.name} has no registered providers.`,
      );
    }
    const typeFactories = providers
      .filter(([ResolverType]) => {
        return compareClasses(Type, ResolverType);
      })
      .map(([_, resolveFunction]) => resolveFunction);
    if (!typeFactories.length) {
      throw new ParamNotResolveable(
        `Class ${Type.name} has no registered resolution factories.`,
      );
    }
    for (let i = 0, n = providers.length; i < n; i++) {
      const resolution = await typeFactories[i](ctx, Type);
      if (resolution !== undefined) {
        return resolution;
      }
    }
    throw new ParamNotResolveable(
      `Class ${Type.name} has registered service providers, but they did not return a defined value for ${Type.name}.`,
    );
  }
}
