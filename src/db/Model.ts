import { Model as M } from 'objection';
import { CanValidate, validate, validateSync, ValidationErrorCollection } from '../validation';

export class Model extends M implements CanValidate {
  static modelName() {
    return this.name.replace('Model', '').toLowerCase();
  }
  static fillable() {
    return [];
  }
  public save(): Promise<Model> {
    return this.$query().insert();
  }
  public delete(): Promise<Number | string> {
    return this.$query().delete();
  }
  public validate(): Promise<ValidationErrorCollection | true> {
    return validate(this);
  }
  public validateSync(): ValidationErrorCollection | true {
    return validateSync(this);
  }
}
