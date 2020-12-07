export class Middleware {
  public bind() {
    return this.handle.bind(this);
  }
  public async handle(...args: any[]): Promise<void> {}
}
