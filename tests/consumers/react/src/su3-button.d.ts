// React needs to know the custom element's props to type JSX. Properties are set as attributes (or
// properties, in React 19); `onClick` is a standard DOM event, so it works without a wrapper.
import type { ButtonSize, ButtonVariant, FormSubmitterType, Su3Button } from 'su3-web-materials';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type Su3ButtonProps = DetailedHTMLProps<HTMLAttributes<Su3Button>, Su3Button> & {
  variant?: ButtonVariant;
  type?: FormSubmitterType;
  name?: string;
  value?: string;
  size?: ButtonSize;
  disabled?: boolean;
  'soft-disabled'?: boolean;
  href?: string;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'su3-button': Su3ButtonProps;
    }
  }
}
