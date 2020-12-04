export class BaseException extends Error {
  public readonly code: number = 500;

  static toException(e: Error) {
    if (e instanceof BaseException) {
      return e;
    }
    const exception = new this(e.message);
    exception.stack = e.stack;
    return exception;
  }

  public getDescription(): string {
    return 'error';
  }
}
