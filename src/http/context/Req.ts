import { Validator } from '../../validation/Validator';

const ORIGINAL_BODY = Symbol('original body');

export class Body extends Validator {
  constructor(obj: object) {
    super();
    Object.assign(this, obj);
    this[ORIGINAL_BODY] = JSON.parse(JSON.stringify(obj));
  }
  getOriginal() {
    return this[ORIGINAL_BODY];
  }
}
export class Headers extends Validator {
  constructor(obj: object) {
    super();
    Object.assign(this, obj);
  }
}
export class Params extends Validator {
  constructor(obj: object) {
    super();
    Object.assign(this, obj);
  }
}
export class Query extends Validator {
  constructor(obj: object) {
    super();
    Object.assign(this, obj);
  }
}
export class Old extends Validator {
  constructor(obj: object) {
    super();
    Object.assign(this, obj);
  }
}
