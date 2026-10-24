import { css } from 'lit';
import { fieldFrame } from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The field frame (label, container, supporting text) is shared with the pickers; this adds the
// popup surface. The public hooks are `--su3-comp-select-*`.
export const selectStyles = [
  fieldFrame('select'),
  css`
    /* A fixed element is sized against the viewport, so 100% here is the viewport height. */
    .surface {
      position: fixed;
      inset: auto;
      box-sizing: border-box;
      display: none;
      max-block-size: calc(100% - 2 * ${sysVar('space-4')});
      margin: ${compVar('select-offset', sysVar('space-1'))};
      padding-block: ${sysVar('space-2')};
      overflow-y: auto;
      border: ${sysVar('size-border-width')} solid ${sysVar('color-elevation-edge')};
      border-radius: ${compVar('select-menu-shape', sysVar('shape-md'))};
      background-color: ${compVar('select-menu-color', sysVar('color-surface-raised'))};
      box-shadow: ${compVar('select-menu-elevation', sysVar('elevation-2'))};
      color: ${sysVar('color-text')};
    }

    .surface:popover-open {
      display: block;
      animation: select-enter ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')};
    }

    @keyframes select-enter {
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
  `,
];
