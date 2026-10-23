import { css } from 'lit';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The default minimum width is four large control heights.
const defaultMinWidth = css`calc(${sysVar('size-control-lg')} * 4)`;

// The public hooks are `--su3-comp-menu-*`. The surface is a popover in the top layer, placed with
// fixed coordinates from the element; its margin carries the gap to the trigger.
export const menuStyles = css`
  :host {
    display: inline-block;
  }

  :host([hidden]) {
    display: none;
  }

  .surface {
    position: fixed;
    inset: auto;
    box-sizing: border-box;
    display: none;
    min-inline-size: ${compVar('menu-min-width', defaultMinWidth)};
    max-block-size: calc(100% - 2 * ${sysVar('space-4')});
    margin: ${compVar('menu-offset', sysVar('space-1'))};
    padding-block: ${sysVar('space-2')};
    overflow-y: auto;
    border: ${sysVar('size-border-width')} solid ${sysVar('color-elevation-edge')};
    border-radius: ${compVar('menu-container-shape', sysVar('shape-md'))};
    background-color: ${compVar('menu-container-color', sysVar('color-surface-raised'))};
    box-shadow: ${compVar('menu-elevation', sysVar('elevation-2'))};
    color: ${sysVar('color-text')};
  }

  .surface:popover-open {
    display: block;
    animation: menu-enter ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')};
  }

  @keyframes menu-enter {
    from {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .surface:popover-open {
      animation: none;
    }
  }

  @media (forced-colors: active) {
    .surface {
      border-color: CanvasText;
    }
  }
`;
