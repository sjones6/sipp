import { Model as M } from 'objection';

export class Model extends M {
  static modelName() {
    return this.name.replace('Model', '').toLowerCase();
  }
}