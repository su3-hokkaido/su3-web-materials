import { css } from 'lit';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The surface uses the inverse of the page (text on surface swapped), like the snackbar, so it
// stands out in both themes with existing color roles. The public hooks are `--su3-comp-tooltip-*`.
export const tooltipStyles = css`
  :host {
    display: inline-block;
  }

  :host([hidden]) {
    display: none;
  }

  /*
   * A popover in the top layer, placed with fixed coordinates from the element. The margin carries
   * the gap to the trigger: the element reads it back to flip and clamp, and subtracts it from the
   * coordinates it sets.
   */
  .surface {
    position: fixed;
    inset: auto;
    box-sizing: border-box;
    display: none;
    width: max-content;
    max-width: min(
      ${compVar('tooltip-max-width', `calc(${sysVar('size-control-lg').cssText} * 5)`)},
      calc(100vw - 2 * ${sysVar('space-2')})
    );
    margin: ${compVar('tooltip-offset', sysVar('space-2'))};
    padding-block: ${sysVar('space-1')};
    padding-inline: ${sysVar('space-2')};
    border: 0;
    border-radius: ${compVar('tooltip-container-shape', sysVar('shape-sm'))};
    background-color: ${compVar('tooltip-container-color', sysVar('color-text'))};
    box-shadow: ${compVar('tooltip-elevation', sysVar('elevation-2'))};
    color: ${compVar('tooltip-label-color', sysVar('color-surface'))};
    font-family: ${sysVar('typeface-sans')};
    font-size: ${sysVar('type-label-sm-size')};
    font-weight: ${sysVar('type-label-weight')};
    line-height: ${sysVar('type-label-sm-line-height')};
    overflow: visible;
    overflow-wrap: anywhere;
  }

  .surface:popover-open {
    display: block;
    animation: tooltip-enter ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')};
  }

  @keyframes tooltip-enter {
    from {
      opacity: 0;
    }
  }

  @media (forced-colors: active) {
    .surface {
      border: ${sysVar('size-border-width')} solid CanvasText;
    }
  }
`;
