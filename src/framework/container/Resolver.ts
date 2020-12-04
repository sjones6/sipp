import { ParamNotResolveable } from '../../exceptions/ParamNotResolveable';
import { RequestContext } from '../../http/';

interface ResolutionFunc<T> {
  (ctx: RequestContext, Type: any): Promise<T> | T;
}

type resolutionTuple = [any, ResolutionFunc<any>];

export const RESOLVER_KEY = '__RESOLVER_STORAGE_KEY';

export class Resolver {
  private readonly resolutionMap: WeakMap<object, Array<ResolutionFunc<any>>>;
  private readonly rules: Array<resolutionTuple>;
  constructor() {
    this.resolutionMap = new WeakMap();
    this.rules = [];
  }

  async resolve(Type, ctx: RequestContext): Promise<any> {
    const resolvers = this.getResolvers(Type);
    if (!resolvers.length) {
      throw new ParamNotResolveable(`Class ${Type.name} has no registered resolvers.`);
    }
    for (let i = 0, n = resolvers.length; i < n; i++) {
      const resolution = await resolvers[i](ctx, Type);
      if (resolution !== undefined) {
        return resolution;
      }
    }
    throw new ParamNotResolveable(
      `Class ${Type.name} has registered resolvers, but they did not return a value.`,
    );
  }

  addResolver<ResolutionType>(
    Type,
    resolverCb: ResolutionFunc<ResolutionType>,
  ) {
    const resolvers = this.resolutionMap.get(Type) || [];
    resolvers.push(resolverCb);
    this.resolutionMap.set(Type, resolvers);
    this.rules.push([Type, resolverCb]);
  }

  getResolvers(Type): Array<ResolutionFunc<any>> {
    // get any rule for a class that extends the class
    return (
      this.resolutionMap.get(Type) ||
      this.rules
        .filter(([RegisteredType]) => {
          return this.compareClasses(Type, RegisteredType);
        })
        .map(([RegisteredType, resolverFn]) => resolverFn)
    );
  }

  hasResolver(Type): boolean {
    // check if the type has a direct resolver
    if (this.resolutionMap.has(Type)) {
      return true;
    }

    // get any rule for a class that extends the class
    return !!this.rules.find(([RegisteredType]) => {
      return this.compareClasses(RegisteredType, Type);
    });
  }

  private compareClasses(ChildType, PotentialParentType): boolean {
    return (
      ChildType === PotentialParentType ||
      ChildType.prototype instanceof PotentialParentType ||
      ChildType.name === PotentialParentType.name
    );
  }
}
