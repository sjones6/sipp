import { Fragment, h } from './jsx';

interface PropsWithChildren {
  children?: any;
}

export const jsx = (tagName, props: PropsWithChildren) => {
  const { children, ...otherProps } = props || {};
  return h(
    tagName,
    otherProps,
    ...(Array.isArray(children) ? children : [children]),
  );
};

export const jsxs = jsx;

export { Fragment };
