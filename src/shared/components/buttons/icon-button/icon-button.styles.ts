import { css } from 'lit';
import {
  focusRing,
  focusRingForcedColors,
  stateLayerBox,
  stateLayerOpacity,
  touchTargetBox,
} from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// Variants and the toggle states only change the private `--_*` properties; the public hooks are
// `--su3-comp-icon-button-*` (see the @cssprop list on Su3IconButton).
export const iconButtonStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  .control {
    /* Defaults: the standard variant at the medium size. */
    --_container: transparent;
    --_icon-color: ${sysVar('color-text-muted')};
    --_border: transparent;
    --_container-disabled: transparent;
    --_border-disabled: transparent;
    --_size: ${sysVar('size-control-md')};
    --_icon: ${sysVar('size-icon-md')};

    position: relative;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: ${compVar('icon-button-size', 'var(--_size)')};
    height: ${compVar('icon-button-size', 'var(--_size)')};
    margin: 0;
    padding: 0;
    border: ${sysVar('size-border-width')} solid
      ${compVar('icon-button-border-color', 'var(--_border)')};
    border-radius: ${compVar('icon-button-container-shape', sysVar('shape-md'))};
    background-color: ${compVar('icon-button-container-color', 'var(--_container)')};
    color: ${compVar('icon-button-icon-color', 'var(--_icon-color)')};
    cursor: pointer;
    appearance: none;
    -webkit-tap-highlight-color: transparent;
    transition: background-color ${sysVar('motion-duration-fast')}
      ${sysVar('motion-easing-standard')};
  }

  :host([variant='filled']) .control {
    --_container: ${sysVar('color-accent')};
    --_icon-color: ${sysVar('color-on-accent')};
  }

  :host([variant='tonal']) .control {
    --_container: ${sysVar('color-accent-subtle')};
    --_icon-color: ${sysVar('color-on-accent-subtle')};
  }

  :host([variant='outlined']) .control {
    --_icon-color: ${sysVar('color-accent')};
    --_border: ${sysVar('color-border-strong')};
  }

  /* Toggle buttons: the off state is quieter, the on state shows the variant's emphasis. */
  :host([toggle][selected]) .control {
    --_icon-color: ${sysVar('color-accent')};
  }

  :host([variant='filled'][toggle]:not([selected])) .control {
    --_container: ${sysVar('color-surface-sunken')};
    --_icon-color: ${sysVar('color-text-muted')};
  }

  :host([variant='filled'][toggle][selected]) .control {
    --_container: ${sysVar('color-accent')};
    --_icon-color: ${sysVar('color-on-accent')};
  }

  :host([variant='tonal'][toggle]:not([selected])) .control {
    --_container: ${sysVar('color-surface-sunken')};
    --_icon-color: ${sysVar('color-text-muted')};
  }

  :host([variant='tonal'][toggle][selected]) .control {
    --_container: ${sysVar('color-accent-subtle')};
    --_icon-color: ${sysVar('color-on-accent-subtle')};
  }

  :host([variant='outlined'][toggle]:not([selected])) .control {
    --_icon-color: ${sysVar('color-text-muted')};
  }

  :host([variant='outlined'][toggle][selected]) .control {
    --_container: ${sysVar('color-accent-subtle')};
    --_icon-color: ${sysVar('color-on-accent-subtle')};
    --_border: transparent;
  }

  :host([size='sm']) .control {
    --_size: ${sysVar('size-control-sm')};
    --_icon: ${sysVar('size-icon-sm')};
  }

  :host([size='lg']) .control {
    --_size: ${sysVar('size-control-lg')};
    --_icon: ${sysVar('size-icon-lg')};
  }

  slot::slotted(*) {
    flex: none;
    width: ${compVar('icon-button-icon-size', 'var(--_icon)')};
    height: ${compVar('icon-button-icon-size', 'var(--_icon)')};
  }

  /* With a selected icon, the default icon is shown while off and the selected one while on. */
  .control.has-selected-icon slot[name='selected'] {
    display: none;
  }

  .control.has-selected-icon[aria-pressed='true'] slot[name='selected'] {
    display: contents;
  }

  .control.has-selected-icon[aria-pressed='true'] slot:not([name]) {
    display: none;
  }

  /* The state layer paints the icon color over the container. */
  .control::before {
    ${stateLayerBox(`calc(-1 * ${sysVar('size-border-width').cssText})`)}
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
    ${focusRing('icon-button')}
  }

  .control:disabled {
    background-color: var(--_container-disabled);
    border-color: var(--_border-disabled);
    color: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
      transparent
    );
    cursor: default;
  }

  :host([variant='filled']) .control:disabled,
  :host([variant='tonal']) .control:disabled {
    --_container-disabled: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-container-opacity')} * 100%),
      transparent
    );
  }

  :host([variant='outlined']) .control:disabled {
    --_border-disabled: color-mix(
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

  @media (forced-colors: active) {
    .control {
      border-color: ButtonText;
    }

    .control:focus-visible {
      ${focusRingForcedColors}
    }

    .control:hover:not(:disabled) {
      border-color: Highlight;
    }

    :host([toggle][selected]) .control {
      border-color: Highlight;
    }

    .control:disabled {
      border-color: GrayText;
      color: GrayText;
    }
  }
`;
