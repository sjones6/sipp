import { Fragment, h } from './jsx';

interface PropsWithChildren {
  children?: any;
  [key: string]: any;
}

export const jsx = (tagName, props: PropsWithChildren) => {
  const { children, ...otherProps } = props || { children: null };
  return h(
    tagName,
    otherProps,
    ...(Array.isArray(children)
      ? children
      : children != null
      ? [children]
      : []),
  );
};

export const jsxs = jsx;

export { Fragment };
