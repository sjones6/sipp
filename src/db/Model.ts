import { Model as M, Transaction, QueryBuilder } from 'objection';
import { STORAGE } from 'src/constants';
import { getStore, hasStore } from '../utils/async-store';
import {
  IValidator,
  validate,
  validateSync,
  ValidationErrorCollection,
} from '../validation';

type EagerRelationExpression = {
  [key: string]: EagerRelationExpression | boolean;
};

export class Model extends M implements IValidator {
  static modelName() {
    return this.name.replace('Model', '').toLowerCase();
  }
  static fillable(): string[] {
    return [];
  }
  static eager(): EagerRelationExpression | string | false {
    return this.relationMappings
      ? Object.keys(this.relationMappings).join(' ')
      : false;
  }
  static load(trx?: Transaction): QueryBuilder<Model> {
    const eager = this.eager();
    const query = this.query(trx);
    if (eager) {
      query.withGraphFetched(eager);
    }
    return query;
  }
  static resolveTransaction(trx?: Transaction): Transaction | undefined {
    if (trx) {
      return trx;
    }
    return hasStore() ? getStore().get(STORAGE.TRANSACTION_KEY) : undefined;
  }
  static query(trx?: Transaction) {
    return M.query.bind(this)(this.resolveTransaction(trx));
  }
  static relatedQuery(relationName: any, trx?: Transaction) {
    return M.relatedQuery.bind(this)(
      relationName,
      this.resolveTransaction(trx),
    );
  }
  public $query(trx?: Transaction) {
    return super.$query(Model.resolveTransaction(trx));
  }
  public $relatedQuery(relationName: any, trx?: Transaction) {
    return super.$relatedQuery(relationName, Model.resolveTransaction(trx));
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
