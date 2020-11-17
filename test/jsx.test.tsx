import { expect } from 'chai';
import { h } from '../src';

const Child = ({ name }) => {
  return <span>{name}</span>;
};

describe('h', function () {
  it('simple', function () {
    expect(<div>Name</div>).equal('<div>Name</div>');
  });

  it('with component', function () {
    expect(
      <div>
        <Child name="foo" />
      </div>,
    ).equal('<div><span>foo</span></div>');
  });

  it('null does not render', function () {
    expect(
      <div>
        <Child name={null} />
      </div>,
    ).equal('<div><span></span></div>');
  });

  it('undefined is stringified', function () {
    expect(
      <div>
        <Child name={null} />
      </div>,
    ).equal('<div><span></span></div>');
  });
});
