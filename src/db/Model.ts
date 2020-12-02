import { Model as M, Transaction, QueryBuilder } from 'objection';
import { getStore } from '../utils/async-store';
import {
  CanValidate,
  validate,
  validateSync,
  ValidationErrorCollection,
} from '../validation';

export const TRANSACTION_KEY = 'transaction-storage-key';

export class Model extends M implements CanValidate {
  static modelName() {
    return this.name.replace('Model', '').toLowerCase();
  }
  static fillable(): string[] {
    return [];
  }
  static eager(): string[] {
    return this.relationMappings ? Object.keys(this.relationMappings) : [];
  }
  static load(trx?: Transaction): QueryBuilder<Model> {
    const eager = this.eager();
    const query = this.query(trx);
    if (eager.length) {
      query.withGraphFetched(eager);
    }
    return query;
  }
  static query(trx?: Transaction) {
    const store = getStore();
    return M.query.bind(this)(trx || store.get(TRANSACTION_KEY));
  }
  static relatedQuery(relationName: any, trx?: Transaction) {
    const store = getStore();
    return M.relatedQuery.bind(this)(
      relationName,
      trx || store.get(TRANSACTION_KEY),
    );
  }
  public $query(trx?: Transaction) {
    const store = getStore();
    return super.$query(trx || store.get(TRANSACTION_KEY));
  }
  public $relatedQuery(relationName: any, trx?: Transaction) {
    const store = getStore();
    return super.$relatedQuery(relationName, trx || store.get(TRANSACTION_KEY));
  }
  public save(): Promise<Model> {
    return this.$query().insert();
  }
  public delete(): Promise<Number | string> {
    return this.$query().delete();
  }
  public validate(): Promise<ValidationErrorCollection> {
    return validate(this);
  }
  public validateSync(): ValidationErrorCollection {
    return validateSync(this);
  }
}
