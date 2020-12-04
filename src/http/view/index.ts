import { h } from '../../jsx';

export class View {
  public renderToHtml() {
    return this.render(h);
  }
  protected render(h, ...args: any[]) {
    throw new Error('child views must implement this method');
  }
}
