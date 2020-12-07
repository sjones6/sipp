export interface IServiceProviderResolutionFn {
  (Type: any): any;
}

export interface IServiceProviderFactoryFn {
  (resolve: IServiceProviderResolutionFn, Type: any): any;
}

export interface IServiceRegistryFn {
  (
    ConstructorScope: '*' | any | any[],
    Type: any,
    factoryFn: IServiceProviderFactoryFn,
  ): void;
}
