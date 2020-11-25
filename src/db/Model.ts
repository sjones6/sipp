import { Model as M, ValidationError } from 'objection';

export class Model extends M {
  static modelName() {
    return this.name.replace('Model', '').toLowerCase();
  }
  static fillable() {
    return [];
  }
  public validate(): true | ValidationError {
    try {
      this.$validate();
      return true;
    } catch (err) {
      return err;
    }
  }
  public save(): Promise<Model> {
    return this.$query().insert();
  }
  public delete(): Promise<Number | string> {
    return this.$query().delete();
  }
}
