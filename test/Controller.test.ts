import { Controller } from "../src";
import { expect } from "chai";

class TestController extends Controller {};

class OverriddenController extends Controller {
  basePath = '/foo'
};

describe('controller', () => {

  it('getBathPath - not overriden', () => {
    const c = new TestController();
    expect(c.getBasePath()).equal('test');
  });

  it('getBathPath - overriden', () => {
    const c = new OverriddenController();
    expect(c.getBasePath()).equal('foo');
  });

});