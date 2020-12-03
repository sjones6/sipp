import { Validator } from '../../validation/Validator';

export class Body extends Validator {
  constructor(obj: object) {
    super();
    Object.assign(this, obj);
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
