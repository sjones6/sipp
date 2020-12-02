import { logger } from '../../logger';
import { IMiddlewareFunc } from '../../interfaces';
import { TRANSACTION_KEY, Model } from '../../db';
import { getStore } from '../../utils/async-store';

export const transacting: IMiddlewareFunc = async (): Promise<void> => {
  logger.debug('initializing transaction');
  const store = getStore();
  if (!store.has(TRANSACTION_KEY)) {
    const trx = await Model.startTransaction();
    getStore().set(TRANSACTION_KEY, trx);
  }
};
