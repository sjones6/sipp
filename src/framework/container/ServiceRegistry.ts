import { compareClasses } from '../../utils';
import { RequestContext } from '../../http';

interface ResolutionFunc<T> {
  (ctx: RequestContext, Type: any): Promise<T> | T;
}

type RegisteredProvider = [any, ResolutionFunc<any>];

export class ServiceRegistry {
  private readonly serviceMap = new Map<any, RegisteredProvider[]>();
  private readonly resolutionCache = new Map<any, RegisteredProvider[]>();
  private readonly globalProviders: RegisteredProvider[] = [];

  public registerFor<T>(
    ProvidedClasses: '*' | any | any[],
    Type: any,
    fn: ResolutionFunc<T>,
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
    typeProvider: [any, ResolutionFunc<T>],
  ): void {
    const providers = this.serviceMap.get(ProvidedClass) || [];
    providers.push(typeProvider);
    this.serviceMap.set(ProvidedClass, providers);
  }
}
