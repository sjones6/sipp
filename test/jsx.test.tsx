import { expect } from 'chai';
import { h, Fragment } from '../src';

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
        <Child name={undefined} />
      </div>,
    ).equal('<div><span>undefined</span></div>');
  });

  it('a fragment is stringified', function () {
    expect(
      <Fragment
        children={[
          <Child name={'one'} />,
          <Child name={'two'} />,
          <Child name={'three'} />,
        ]}
      />,
    ).equal('<span>one</span><span>two</span><span>three</span>');
  });
});
