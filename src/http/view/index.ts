export class View {
  public renderToHtml(): Promise<string> | string {
    return this.render();
  }
  // @ts-ignore
  protected render(...args: any[]): Promise<string> | string {
    throw new Error('child views must implement this method');
  }
}
