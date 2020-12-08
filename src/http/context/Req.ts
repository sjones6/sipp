import { Validator } from '../../validation/Validator';
import { Request } from 'express';

const ORIGINAL_BODY = Symbol('original body');

export class Req {
  public readonly method: string;
  public readonly path: string;
  public readonly id: string;

  private readonly sym = Symbol('request storage');

  constructor(public readonly req: Request) {
    req[this.sym] = {};
    this.method = req.method;
    this.path = req.path;
    this.id = req.id;
  }
  public set<T>(key, value: T): void {
    this.req[this.sym][key] = value;
  }
  public get<T>(key): T {
    return this.req[this.sym][key];
  }
}

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
