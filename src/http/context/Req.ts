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
  constructor(private __body: object) {
    super();
    Object.assign(this, __body);
    this[ORIGINAL_BODY] = JSON.parse(JSON.stringify(__body));
  }
  getOriginal() {
    return this[ORIGINAL_BODY];
  }
  get<T>(key: string, defaultValue?: T): T {
    return this.hasOwnProperty(key) ? this[key] : defaultValue;
  }
  set<T>(key: string, value: T): void {
    this.__body[key] = value;
    this[key] = value;
  }
}
export class Headers extends Validator {
  constructor(private __headers: object) {
    super();
    Object.assign(this, __headers);
  }
  get<T>(key: string, defaultValue?: T): T {
    return this.hasOwnProperty(key) ? this[key] : defaultValue;
  }
  set<T>(key: string, value: T): void {
    this.__headers[key] = value;
    this[key] = value;
  }
}
export class Params extends Validator {
  constructor(private __params: object) {
    super();
    Object.assign(this, __params);
  }
  get<T>(key: string, defaultValue?: T): T {
    return this.hasOwnProperty(key) ? this[key] : defaultValue;
  }
  set<T>(key: string, value: T): void {
    this.__params[key] = value;
    this[key] = value;
  }
}
export class Query extends Validator {
  constructor(private __query: object) {
    super();
    Object.assign(this, __query);
  }
  get<T>(key: string, defaultValue?: T): T {
    return this.hasOwnProperty(key) ? this[key] : defaultValue;
  }
  set<T>(key: string, value: T): void {
    this.__query[key] = value;
    this[key] = value;
  }
}
