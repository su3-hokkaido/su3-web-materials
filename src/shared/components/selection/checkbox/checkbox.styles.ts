import { css } from 'lit';
import {
  focusRing,
  focusRingForcedColors,
  stateLayerBox,
  stateLayerOpacity,
  touchTargetBox,
} from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The native input covers the whole control (it is invisible but receives pointer and keyboard
// input); `.box` and its mark are the visuals and follow the input's state through sibling
// selectors. Private `--_*` properties carry the state colors; the public hooks are
// `--su3-comp-checkbox-*` (see the @cssprop list on Su3Checkbox).
export const checkboxStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  .root {
    --_border: ${compVar('checkbox-border-color', sysVar('color-border-strong'))};
    --_fill: transparent;
    --_halo: ${sysVar('color-text')};
    --_mark: ${compVar('checkbox-mark-color', sysVar('color-on-accent'))};

    position: relative;
    display: inline-flex;
    align-items: center;
    gap: ${compVar('checkbox-gap', sysVar('space-3'))};
    min-height: ${sysVar('size-control-md')};
    cursor: pointer;
    color: ${compVar('checkbox-label-color', sysVar('color-text'))};
    font-family: ${sysVar('typeface-sans')};
    font-size: ${sysVar('type-body-size')};
    line-height: ${sysVar('type-body-line-height')};
    -webkit-tap-highlight-color: transparent;
  }

  .root.disabled {
    cursor: default;
    color: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
      transparent
    );
  }

  @media (pointer: coarse) {
    .root::after {
      ${touchTargetBox}
    }
  }

  .input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }

  .box {
    position: relative;
    box-sizing: border-box;
    flex: none;
    width: ${compVar('checkbox-size', sysVar('size-checkbox'))};
    height: ${compVar('checkbox-size', sysVar('size-checkbox'))};
    border: ${sysVar('size-focus-ring-width')} solid var(--_border);
    border-radius: ${compVar('checkbox-container-shape', sysVar('shape-xs'))};
    background-color: var(--_fill);
    color: var(--_mark);
    transition:
      background-color ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')},
      border-color ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')};
  }

  /* The state layer is a round halo around the box, in the text color or, when on, the accent. */
  .box::before {
    ${stateLayerBox(`calc(-1 * ${sysVar('space-2').cssText})`)}
    border-radius: ${sysVar('shape-pill')};
    background-color: var(--_halo);
  }

  .mark {
    display: block;
    width: 100%;
    height: 100%;
  }

  .check,
  .dash {
    opacity: 0;
    transition: opacity ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')};
  }

  .input:checked ~ .box,
  .input:indeterminate ~ .box {
    --_border: ${compVar('checkbox-selected-container-color', sysVar('color-accent'))};
    --_fill: ${compVar('checkbox-selected-container-color', sysVar('color-accent'))};
    --_halo: ${compVar('checkbox-selected-container-color', sysVar('color-accent'))};
  }

  .input:checked ~ .box .check,
  .input:indeterminate ~ .box .dash {
    opacity: 1;
  }

  .input:indeterminate ~ .box .check {
    opacity: 0;
  }

  .root:hover .input:not(:disabled) ~ .box::before {
    ${stateLayerOpacity.hover}
  }

  .input:focus-visible ~ .box::before {
    ${stateLayerOpacity.focus}
  }

  .root:active .input:not(:disabled) ~ .box::before {
    ${stateLayerOpacity.pressed}
  }

  .input:focus-visible ~ .box {
    ${focusRing('checkbox')}
  }

  .input:disabled ~ .box {
    --_border: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
      transparent
    );
  }

  .input:disabled:checked ~ .box,
  .input:disabled:indeterminate ~ .box {
    --_fill: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
      transparent
    );
  }

  .label[hidden] {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .box,
    .box::before,
    .check,
    .dash {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .box {
      --_border: ButtonText;
      --_mark: HighlightText;
    }

    .input:checked ~ .box,
    .input:indeterminate ~ .box {
      --_border: Highlight;
      --_fill: Highlight;
    }

    .input:focus-visible ~ .box {
      ${focusRingForcedColors}
    }

    .input:disabled ~ .box,
    .root.disabled {
      --_border: GrayText;
      color: GrayText;
    }

    .input:disabled:checked ~ .box,
    .input:disabled:indeterminate ~ .box {
      --_fill: GrayText;
    }
  }
`;
