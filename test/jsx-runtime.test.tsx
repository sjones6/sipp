import { expect } from 'chai';
import { jsx, Fragment } from '../src/jsx-runtime';

describe('jsx-runtime', () => {
  it('should render a component with no children', () => {
    expect(jsx('div', {})).equal('<div></div>');
  });

  it('should render a component with a child', () => {
    expect(
      jsx('div', {
        children: 'one',
      }),
    ).equal('<div>one</div>');
  });

  it('should render a component with a nested children', () => {
    expect(
      jsx('div', {
        children: [
          jsx('div', { children: 'one' }),
          jsx('div', { children: 'two' }),
        ],
      }),
    ).equal('<div><div>one</div><div>two</div></div>');
  });

  it('should render a component with a nested childre', () => {
    expect(
      Fragment({
        children: [
          jsx('div', { children: 'one' }),
          jsx('div', { children: 'two' }),
        ],
      }),
    ).equal('<div>one</div><div>two</div>');
  });

  it('should render a component with a nested childre', () => {
    expect(
      Fragment({
        children: [
          jsx('div', { children: 'one' }),
          jsx('div', { children: 'two' }),
        ],
      }),
    ).equal('<div>one</div><div>two</div>');
  });

  it('should render a component without children', () => {
    expect(
      jsx('input', {
        type: 'checkbox',
        id: 'foo',
        class: 'bar',
        onchange: 'baz()',
      }),
    ).equal(
      '<input type="checkbox" id="foo" class="bar" onchange="baz()"></input>',
    );
  });
});
