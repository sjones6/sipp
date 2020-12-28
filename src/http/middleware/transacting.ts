import { IMiddlewareFunc } from '../../interfaces';
import { Model } from '../../db';
import { getStore } from '../../utils/async-store';
import { STORAGE } from '../../constants';
import { Request } from 'express';

export const transacting: IMiddlewareFunc = async (
  req: Request,
): Promise<void> => {
  req.logger.debug('initializing transaction');
  const store = getStore();
  if (!store.has(STORAGE.TRANSACTION_KEY)) {
    const trx = await Model.startTransaction();
    getStore().set(STORAGE.TRANSACTION_KEY, trx);
  }
};
