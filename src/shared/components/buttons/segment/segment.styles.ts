import { css } from 'lit';
import {
  focusRing,
  focusRingForcedColors,
  stateLayerBox,
  stateLayerOpacity,
  touchTargetBox,
} from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// Private custom properties (`--_*`) carry the per-state and per-size defaults. The public hooks are
// `--su3-comp-segmented-button-*`, which win over those defaults when set (see the @cssprop list on
// Su3Segment). The group sets `size` and `position` on each segment.
export const segmentStyles = css`
  :host {
    display: inline-flex;
  }

  :host([hidden]) {
    display: none;
  }

  /* Neighbors share one border line. */
  :host([position='middle']),
  :host([position='last']) {
    margin-inline-start: calc(
      -1 * ${compVar('segmented-button-border-width', sysVar('size-border-width'))}
    );
  }

  .control {
    --_container: transparent;
    --_label: ${sysVar('color-text')};
    --_overlay: 1;
    --_container-disabled: transparent;
    --_height: ${sysVar('size-control-md')};
    --_padding: ${sysVar('space-4')};
    --_icon: ${sysVar('size-icon-sm')};
    --_font-size: ${sysVar('type-label-size')};
    --_line-height: ${sysVar('type-label-line-height')};

    position: relative;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${sysVar('space-2')};
    height: ${compVar('segmented-button-height', 'var(--_height)')};
    margin: 0;
    padding-block: 0;
    padding-inline: ${compVar('segmented-button-padding-inline', 'var(--_padding)')};
    border: ${compVar('segmented-button-border-width', sysVar('size-border-width'))} solid
      ${compVar('segmented-button-border-color', sysVar('color-border-strong'))};
    border-radius: 0;
    background-color: ${compVar('segmented-button-container-color', 'var(--_container)')};
    color: ${compVar('segmented-button-label-color', 'var(--_label)')};
    font-family: ${sysVar('typeface-sans')};
    font-size: var(--_font-size);
    font-weight: ${sysVar('type-label-weight')};
    line-height: var(--_line-height);
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    appearance: none;
    -webkit-tap-highlight-color: transparent;
    transition: background-color ${sysVar('motion-duration-fast')}
      ${sysVar('motion-easing-standard')};
  }

  /* The selected segment is drawn above its neighbors so its whole border shows. */
  :host([selected]) .control {
    --_container: ${compVar('segmented-button-selected-container-color', sysVar('color-accent-subtle'))};
    --_label: ${compVar('segmented-button-selected-label-color', sysVar('color-on-accent-subtle'))};
    z-index: 1;
  }

  /* Only the outer corners of the group are rounded; a lone segment rounds both sides. */
  :host(:not([position])) .control,
  :host([position='first']) .control,
  :host([position='only']) .control {
    border-start-start-radius: ${compVar('segmented-button-container-shape', sysVar('shape-md'))};
    border-end-start-radius: ${compVar('segmented-button-container-shape', sysVar('shape-md'))};
  }

  :host(:not([position])) .control,
  :host([position='last']) .control,
  :host([position='only']) .control {
    border-start-end-radius: ${compVar('segmented-button-container-shape', sysVar('shape-md'))};
    border-end-end-radius: ${compVar('segmented-button-container-shape', sysVar('shape-md'))};
  }

  :host([size='sm']) .control {
    --_height: ${sysVar('size-control-sm')};
    --_padding: ${sysVar('space-3')};
    --_font-size: ${sysVar('type-label-sm-size')};
    --_line-height: ${sysVar('type-label-sm-line-height')};
  }

  :host([size='lg']) .control {
    --_height: ${sysVar('size-control-lg')};
    --_padding: ${sysVar('space-6')};
    --_font-size: ${sysVar('type-body-size')};
    --_line-height: ${sysVar('type-body-line-height')};
  }

  .check {
    display: none;
    flex: none;
    width: var(--_icon);
    height: var(--_icon);
  }

  :host([selected]) .check {
    display: inline-flex;
  }

  .label {
    display: inline-block;
  }

  /* State layer, as on su3-button: the label color painted over the container. */
  .control::before {
    ${stateLayerBox(`calc(-1 * ${compVar('segmented-button-border-width', sysVar('size-border-width')).cssText})`)}
  }

  @media (pointer: coarse) {
    .control::after {
      ${touchTargetBox}
    }
  }

  .control:hover:not(:disabled)::before {
    ${stateLayerOpacity.hover}
  }

  .control:focus-visible:not(:disabled)::before {
    ${stateLayerOpacity.focus}
  }

  .control:active:not(:disabled)::before {
    ${stateLayerOpacity.pressed}
  }

  .control:focus-visible {
    ${focusRing('segmented-button')}
    z-index: 2;
  }

  .control:disabled {
    background-color: var(--_container-disabled);
    border-color: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-container-opacity')} * 100%),
      transparent
    );
    color: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
      transparent
    );
    cursor: default;
  }

  :host([selected]) .control:disabled {
    --_container-disabled: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-container-opacity')} * 100%),
      transparent
    );
  }

  @media (prefers-reduced-motion: reduce) {
    .control,
    .control::before {
      transition: none;
    }
  }

  /* System colors replace the palette: borders stay, the selected one is marked by Highlight. */
  @media (forced-colors: active) {
    .control {
      border-color: ButtonText;
    }

    :host([selected]) .control {
      border-color: Highlight;
    }

    .control:focus-visible {
      ${focusRingForcedColors}
    }

    .control:disabled {
      border-color: GrayText;
      color: GrayText;
    }
  }
`;
