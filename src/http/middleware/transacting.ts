import { logger } from '../../logger';
import { IMiddlewareFunc } from '../../interfaces';
import { Model } from '../../db';
import { getStore } from '../../utils/async-store';
import { STORAGE } from '../../constants';

export const transacting: IMiddlewareFunc = async (): Promise<void> => {
  logger.debug('initializing transaction');
  const store = getStore();
  if (!store.has(STORAGE.TRANSACTION_KEY)) {
    const trx = await Model.startTransaction();
    getStore().set(STORAGE.TRANSACTION_KEY, trx);
  }
};
