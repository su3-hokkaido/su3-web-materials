import { css } from 'lit';
import {
  focusRing,
  focusRingForcedColors,
  stateLayerBox,
  stateLayerOpacity,
  touchTargetBox,
} from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// Like the checkbox, the native input covers the control and the track and thumb follow its state
// through sibling selectors. Geometry is computed from the track and thumb sizes: the thumb sits
// `--_pad` from the inside of the track and travels `--_travel` when on.
export const switchStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  .root {
    --_w: ${compVar('switch-track-width', sysVar('size-switch-track-width'))};
    --_h: ${compVar('switch-track-height', sysVar('size-switch-track-height'))};
    --_thumb: ${compVar('switch-thumb-size', sysVar('size-switch-thumb'))};
    --_bw: ${sysVar('size-focus-ring-width')};
    --_pad: calc((var(--_h) - var(--_thumb)) / 2 - var(--_bw));
    --_travel: calc(var(--_w) - var(--_thumb) - 2 * (var(--_pad) + var(--_bw)));
    --_track: transparent;
    --_track-border: ${sysVar('color-border-strong')};
    --_thumb-color: ${sysVar('color-border-strong')};
    --_halo: ${sysVar('color-text')};

    position: relative;
    display: inline-flex;
    align-items: center;
    gap: ${compVar('switch-gap', sysVar('space-3'))};
    min-height: ${sysVar('size-control-md')};
    cursor: pointer;
    color: ${compVar('switch-label-color', sysVar('color-text'))};
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

  .track {
    position: relative;
    box-sizing: border-box;
    flex: none;
    width: var(--_w);
    height: var(--_h);
    border: var(--_bw) solid var(--_track-border);
    border-radius: ${sysVar('shape-pill')};
    background-color: var(--_track);
    transition:
      background-color ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')},
      border-color ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')};
  }

  .thumb {
    position: absolute;
    inset-block: 0;
    inset-inline-start: var(--_pad);
    width: var(--_thumb);
    height: var(--_thumb);
    margin-block: auto;
    border-radius: ${sysVar('shape-pill')};
    background-color: var(--_thumb-color);
    transition:
      transform ${sysVar('motion-duration-medium')} ${sysVar('motion-easing-standard')},
      background-color ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')};
  }

  /* The state layer is a round halo around the thumb and moves with it. */
  .thumb::before {
    ${stateLayerBox(`calc(-1 * ${sysVar('space-2').cssText})`)}
    background-color: var(--_halo);
  }

  .input:checked ~ .track {
    --_track: ${compVar('switch-selected-track-color', sysVar('color-accent'))};
    --_track-border: ${compVar('switch-selected-track-color', sysVar('color-accent'))};
    --_thumb-color: ${sysVar('color-on-accent')};
    --_halo: ${compVar('switch-selected-track-color', sysVar('color-accent'))};
  }

  .input:checked ~ .track .thumb {
    transform: translateX(var(--_travel));
  }

  .root:hover .input:not(:disabled) ~ .track .thumb::before {
    ${stateLayerOpacity.hover}
  }

  .input:focus-visible ~ .track .thumb::before {
    ${stateLayerOpacity.focus}
  }

  .root:active .input:not(:disabled) ~ .track .thumb::before {
    ${stateLayerOpacity.pressed}
  }

  .input:focus-visible ~ .track {
    ${focusRing('switch')}
  }

  .input:disabled ~ .track {
    --_track-border: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
      transparent
    );
    --_thumb-color: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
      transparent
    );
  }

  .input:disabled:checked ~ .track {
    --_track: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-container-opacity')} * 100%),
      transparent
    );
    --_thumb-color: ${sysVar('color-surface')};
  }

  .label[hidden] {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .track,
    .thumb,
    .thumb::before {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .track {
      --_track-border: ButtonText;
      --_thumb-color: ButtonText;
    }

    .input:checked ~ .track {
      --_track: Highlight;
      --_track-border: Highlight;
      --_thumb-color: HighlightText;
    }

    .input:focus-visible ~ .track {
      ${focusRingForcedColors}
    }

    .input:disabled ~ .track,
    .root.disabled {
      --_track-border: GrayText;
      --_thumb-color: GrayText;
      color: GrayText;
    }

    .input:disabled:checked ~ .track {
      --_track: GrayText;
      --_thumb-color: Canvas;
    }
  }
`;
