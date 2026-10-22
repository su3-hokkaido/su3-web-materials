import { css } from 'lit';
import {
  focusRing,
  focusRingForcedColors,
  stateLayerBox,
  stateLayerOpacity,
} from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The surface uses the inverse of the page (text on surface swapped), so it stands out in both
// themes with existing color roles. The public hooks are `--su3-comp-snackbar-*`.
export const snackbarStyles = css`
  :host {
    display: contents;
  }

  :host([hidden]) {
    display: none;
  }

  /* The popover is hidden until open; the class keeps browsers without the Popover API working. */
  .surface {
    position: fixed;
    inset: auto;
    inset-block-end: ${compVar('snackbar-offset', sysVar('space-4'))};
    inset-inline: 0;
    box-sizing: border-box;
    display: none;
    align-items: center;
    gap: ${sysVar('space-2')};
    width: max-content;
    max-width: min(
      ${compVar('snackbar-max-width', `calc(${sysVar('size-control-lg').cssText} * 12)`)},
      calc(100vw - 2 * ${sysVar('space-4')})
    );
    margin: 0 auto;
    padding-block: ${sysVar('space-2')};
    padding-inline: ${sysVar('space-4')} ${sysVar('space-2')};
    border: 0;
    border-radius: ${compVar('snackbar-container-shape', sysVar('shape-sm'))};
    background-color: ${compVar('snackbar-container-color', sysVar('color-text'))};
    box-shadow: ${compVar('snackbar-elevation', sysVar('elevation-3'))};
    color: ${compVar('snackbar-label-color', sysVar('color-surface'))};
    font-family: ${sysVar('typeface-sans')};
    font-size: ${sysVar('type-label-size')};
    font-weight: ${sysVar('type-body-weight')};
    line-height: ${sysVar('type-label-line-height')};
    overflow: visible;
  }

  .open .surface,
  .surface:popover-open {
    display: flex;
    animation: snackbar-enter ${sysVar('motion-duration-medium')}
      ${sysVar('motion-easing-standard')};
  }

  @keyframes snackbar-enter {
    from {
      opacity: 0;
      transform: translateY(${sysVar('space-2')});
    }
  }

  .message {
    flex: 1;
    min-width: 0;
    padding-block: ${sysVar('space-2')};
  }

  /* Text buttons in the action slot take the action color, readable on the inverse surface. */
  .action {
    display: inline-flex;
    flex: none;
  }

  ::slotted([slot='action']) {
    --su3-comp-button-label-color: ${compVar('snackbar-action-color', sysVar('color-accent-subtle'))};
    --su3-comp-button-focus-ring-color: ${compVar('snackbar-focus-ring-color', sysVar('color-accent-subtle'))};
  }

  .dismiss {
    position: relative;
    box-sizing: border-box;
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: ${sysVar('size-control-md')};
    height: ${sysVar('size-control-md')};
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: ${sysVar('shape-pill')};
    background: none;
    color: inherit;
    cursor: pointer;
    appearance: none;
    -webkit-tap-highlight-color: transparent;
  }

  .dismiss::before {
    ${stateLayerBox()}
  }

  .dismiss svg {
    width: ${sysVar('size-icon-md')};
    height: ${sysVar('size-icon-md')};
  }

  .dismiss:hover::before {
    ${stateLayerOpacity.hover}
  }

  .dismiss:focus-visible::before {
    ${stateLayerOpacity.focus}
  }

  .dismiss:active::before {
    ${stateLayerOpacity.pressed}
  }

  .dismiss:focus-visible {
    ${focusRing('snackbar')}
    outline-color: ${compVar('snackbar-focus-ring-color', sysVar('color-accent-subtle'))};
  }

  @media (prefers-reduced-motion: reduce) {
    .open .surface,
    .surface:popover-open {
      animation: none;
    }

    .dismiss::before {
      transition: none;
    }
  }

  /* System colors replace the palette: the surface keeps an outline. */
  @media (forced-colors: active) {
    .surface {
      border: ${sysVar('size-border-width')} solid CanvasText;
      background-color: Canvas;
      color: CanvasText;
    }

    .dismiss:focus-visible {
      ${focusRingForcedColors}
    }
  }
`;
