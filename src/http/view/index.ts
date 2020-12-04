import { h } from '../../jsx';

export class View {
  public renderToHtml(): Promise<string> | string {
    return this.render(h);
  }
  protected render(h, ...args: any[]): Promise<string> | string {
    throw new Error('child views must implement this method');
  }
}
