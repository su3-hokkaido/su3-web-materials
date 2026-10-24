import { css } from 'lit';
import {
  focusRing,
  focusRingForcedColors,
  stateLayerBox,
  stateLayerOpacity,
} from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The public hooks are `--su3-comp-select-option-*`; the host is the focus target, so the focus ring
// and the state layer are drawn from it. The chosen option is tinted.
export const optionStyles = css`
  :host {
    position: relative;
    display: block;
    outline: none;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  :host([hidden]) {
    display: none;
  }

  .option {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: ${sysVar('space-3')};
    min-block-size: ${sysVar('size-control-lg')};
    padding-inline: ${sysVar('space-4')};
    color: ${compVar('select-option-color', sysVar('color-text'))};
    font-family: ${sysVar('typeface-sans')};
    font-size: ${sysVar('type-body-size')};
    font-weight: ${sysVar('type-body-weight')};
    line-height: ${sysVar('type-body-line-height')};
  }

  :host([selected]) .option {
    background-color: ${compVar('select-option-selected-color', sysVar('color-accent-subtle'))};
    color: ${sysVar('color-on-accent-subtle')};
  }

  .option::before {
    ${stateLayerBox()}
  }

  .label {
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ::slotted([slot='leading']) {
    flex: none;
    inline-size: ${sysVar('size-icon-md')};
    block-size: ${sysVar('size-icon-md')};
  }

  :host(:hover:not([disabled])) .option::before {
    ${stateLayerOpacity.hover}
  }

  :host(:focus-visible:not([disabled])) .option::before {
    ${stateLayerOpacity.focus}
  }

  :host(:active:not([disabled])) .option::before {
    ${stateLayerOpacity.pressed}
  }

  :host(:focus-visible) {
    ${focusRing('select')}
    outline-offset: calc(-1 * ${sysVar('size-focus-ring-width')});
  }

  :host([disabled]) {
    cursor: default;
  }

  :host([disabled]) .option {
    color: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
      transparent
    );
  }

  @media (prefers-reduced-motion: reduce) {
    .option::before {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .option {
      color: ButtonText;
    }

    :host([selected]) .option {
      border-inline-start: ${sysVar('size-focus-ring-width')} solid Highlight;
    }

    :host(:focus-visible) {
      ${focusRingForcedColors}
    }

    :host([disabled]) .option {
      color: GrayText;
    }
  }
`;
