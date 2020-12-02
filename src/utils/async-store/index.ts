import als from 'async-local-storage';
als.enable();

export class Store extends Map<string, any> {}

export const hasStore = () => {
  return !!als.get('store');
};

export const getStore = (): Store => {
  const store = (als.get('store') as unknown) as Store;
  if (!store) {
    throw new Error('store has not been set');
  }
  return store;
};

export const initStore = (): Store => {
  als.scope();
  const store = new Store();
  als.set('store', store);
  return store;
};
