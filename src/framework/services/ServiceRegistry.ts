import { IServiceProviderFactoryFn } from 'src/interfaces';
import { compareClasses } from '../../utils';
import { ServiceProvider } from './ServiceProvider';
import { ParamNotResolveable } from '../../exceptions/ParamNotResolveable';
import { TooManyRequestsException } from 'src/exceptions';

export type RegisteredProvider = [any, IServiceProviderFactoryFn];

export class ServiceRegistry {
  private readonly serviceMap = new Map<any, RegisteredProvider[]>();
  private readonly resolutionCache = new Map<any, RegisteredProvider[]>();
  private readonly globalProviders: RegisteredProvider[] = [];

  async resolve(obj, Type): Promise<any> {
    const Constructor = obj.constructor;
    const providers = this.getProvidersFor(Constructor);
    if (!providers.length) {
      throw new ParamNotResolveable(
        `Class ${Constructor.name} has no registered providers.`,
      );
    }
    const resolve = async (Type: any) => {
      const typeFactories = this.filterProvidersForType(providers, Type);
      if (!typeFactories.length) {
        throw new ParamNotResolveable(
          `Class ${Type.name} has no registered resolution factories.`,
        );
      }
      for (let i = 0, n = providers.length; i < n; i++) {
        const typeFactory = typeFactories[i];
        if (!typeFactory) {
          continue;
        }
        const resolution = await typeFactories[i](resolve, Type);
        if (resolution !== undefined) {
          return resolution;
        }
      }

      throw new ParamNotResolveable(
        `Class ${Type.name} has registered service providers, but they did not return a defined value for ${Type.name}.`,
      );
    };
    return resolve(Type);
  }

  private filterProvidersForType(providers: RegisteredProvider[], Type) {
    return (
      providers

        // get just the type resolves for this Type
        .filter(([ResolverType]) => {
          return compareClasses(Type, ResolverType);
        })

        // sort the resolves by direct vs indirect match
        .sort(([AResolverType], [BResolverType]) => {
          const isADirectMatch = AResolverType === Type;
          const isBDirectMatch = BResolverType === Type;
          if (
            (isADirectMatch && isBDirectMatch) ||
            (!isADirectMatch && !isBDirectMatch)
          ) {
            return 0;
          }
          return isADirectMatch ? -1 : 1;
        })

        // return an array of resolution functions
        .map(([_, resolveFunction]) => resolveFunction)
    );
  }

  public registerProviders(providers: ServiceProvider[]): void {
    providers.forEach((provider) => {
      provider.register((ConstructorScope, Type, factoryFn) => {
        this.registerFor(ConstructorScope, Type, factoryFn);
      });
    });
  }

  public getProvidersFor(ObjectClass): RegisteredProvider[] {
    // don't look up all of the providers on every request. It'll be done lazily and cached
    if (!this.resolutionCache.has(ObjectClass)) {
      // resolve the service providers.
      const directServiceProvidersForClass =
        this.serviceMap.get(ObjectClass) || [];
      const indirectServiceProvidersForClass = this.getIndirectProviders(
        ObjectClass,
      );

      // cache them.
      this.resolutionCache.set(ObjectClass, [
        ...directServiceProvidersForClass,
        ...indirectServiceProvidersForClass,
        ...this.globalProviders,
      ]);
    }

    return this.resolutionCache.get(ObjectClass);
  }

  public registerFor<T>(
    ProvidedClasses: '*' | any | any[],
    Type: any,
    fn: IServiceProviderFactoryFn,
  ): void {
    if (ProvidedClasses === '*') {
      this.globalProviders.push([Type, fn]);
      return;
    }
    Array.isArray(ProvidedClasses)
      ? ProvidedClasses.map((ProvidedClass) =>
          this.addToRegistry<T>(ProvidedClass, [Type, fn]),
        )
      : this.addToRegistry<T>(ProvidedClasses, [Type, fn]);
  }

  private getIndirectProviders<T>(ObjectClass): RegisteredProvider[] {
    const indirect = [];
    this.serviceMap.forEach((fns, ProvidedClass) => {
      if (
        ObjectClass !== ProvidedClass &&
        compareClasses(ObjectClass, ProvidedClass)
      ) {
        indirect.push(...fns);
      }
    });
    return indirect;
  }

  private addToRegistry<T>(
    ProvidedClass,
    typeProvider: [any, IServiceProviderFactoryFn],
  ): void {
    const providers = this.serviceMap.get(ProvidedClass) || [];
    providers.push(typeProvider);
    this.serviceMap.set(ProvidedClass, providers);
  }
}

export const registry = new ServiceRegistry();
