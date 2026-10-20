import { css } from 'lit';
import { compVar, sysVar } from '../../../tokens/index.ts';

// Private custom properties (`--_*`) carry the per-variant and per-size defaults. The public hooks
// are `--su3-comp-button-*`, which win over those defaults when set (see the @cssprop list on
// Su3Button). Without any tokens loaded, the built-in fallbacks inside sysVar() apply.
export const buttonStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  .control {
    /* Defaults: the filled variant at the medium size. */
    --_container: ${sysVar('color-accent')};
    --_label: ${sysVar('color-on-accent')};
    --_border: transparent;
    --_overlay: 1;
    --_elevation: ${sysVar('elevation-0')};
    --_elevation-hover: ${sysVar('elevation-0')};
    --_container-disabled: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-container-opacity')} * 100%),
      transparent
    );
    --_border-disabled: transparent;
    --_height: ${sysVar('size-control-md')};
    --_padding: ${sysVar('space-4')};
    --_icon: ${sysVar('size-icon-md')};
    --_font-size: ${sysVar('type-label-size')};
    --_line-height: ${sysVar('type-label-line-height')};

    position: relative;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${compVar('button-gap', sysVar('space-2'))};
    height: ${compVar('button-height', 'var(--_height)')};
    margin: 0;
    padding-block: 0;
    padding-inline: ${compVar('button-padding-inline', 'var(--_padding)')};
    border: ${compVar('button-border-width', sysVar('size-border-width'))} solid
      ${compVar('button-border-color', 'var(--_border)')};
    border-radius: ${compVar('button-container-shape', sysVar('shape-md'))};
    background-color: ${compVar('button-container-color', 'var(--_container)')};
    color: ${compVar('button-label-color', 'var(--_label)')};
    box-shadow: ${compVar('button-elevation', 'var(--_elevation)')};
    font-family: ${compVar('button-font-family', sysVar('typeface-sans'))};
    font-size: ${compVar('button-font-size', 'var(--_font-size)')};
    font-weight: ${compVar('button-font-weight', sysVar('type-label-weight'))};
    line-height: ${compVar('button-line-height', 'var(--_line-height)')};
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    appearance: none;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')},
      box-shadow ${sysVar('motion-duration-medium')} ${sysVar('motion-easing-standard')};
  }

  /* Variants. Each one only changes the private defaults. */
  :host([variant='tonal']) .control {
    --_container: ${sysVar('color-accent-subtle')};
    --_label: ${sysVar('color-on-accent-subtle')};
    --_overlay: 1;
  }

  :host([variant='outlined']) .control {
    --_container: transparent;
    --_label: ${sysVar('color-accent')};
    --_border: ${sysVar('color-border-strong')};
    --_border-disabled: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-container-opacity')} * 100%),
      transparent
    );
    --_container-disabled: transparent;
    --_overlay: 1;
  }

  :host([variant='text']) .control {
    --_container: transparent;
    --_label: ${sysVar('color-accent')};
    --_container-disabled: transparent;
    --_overlay: 1;
  }

  :host([variant='elevated']) .control {
    --_container: ${sysVar('color-surface-raised')};
    --_label: ${sysVar('color-accent')};
    --_border: ${sysVar('color-elevation-edge')};
    --_elevation: ${sysVar('elevation-1')};
    --_elevation-hover: ${sysVar('elevation-2')};
    --_overlay: 1;
  }

  /* Sizes. */
  :host([size='sm']) .control {
    --_height: ${sysVar('size-control-sm')};
    --_padding: ${sysVar('space-3')};
    --_icon: ${sysVar('size-icon-sm')};
    --_font-size: ${sysVar('type-label-sm-size')};
    --_line-height: ${sysVar('type-label-sm-line-height')};
  }

  :host([size='lg']) .control {
    --_height: ${sysVar('size-control-lg')};
    --_padding: ${sysVar('space-6')};
    --_icon: ${sysVar('size-icon-lg')};
    --_font-size: ${sysVar('type-body-size')};
    --_line-height: ${sysVar('type-body-line-height')};
  }

  .label {
    display: inline-block;
  }

  slot[name='leading']::slotted(*),
  slot[name='trailing']::slotted(*) {
    flex: none;
    width: ${compVar('button-icon-size', 'var(--_icon)')};
    height: ${compVar('button-icon-size', 'var(--_icon)')};
  }

  /* State layer: the label color painted over the container. Every variant uses it, so a container
     color overridden with --su3-comp-button-container-color still reacts to hover and press. */
  .control::before {
    content: '';
    position: absolute;
    inset: calc(-1 * ${compVar('button-border-width', sysVar('size-border-width'))});
    border-radius: inherit;
    background-color: currentcolor;
    opacity: 0;
    pointer-events: none;
    transition: opacity ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')};
  }

  /* Extends the hit area to the minimum size on touch screens without changing the visible size. */
  @media (pointer: coarse) {
    .control::after {
      content: '';
      position: absolute;
      inset-block: min(0px, calc((100% - ${sysVar('size-hit-area')}) / 2));
      inset-inline: 0;
    }
  }

  .control:hover:not(:disabled, [aria-disabled='true']) {
    box-shadow: ${compVar('button-elevation', 'var(--_elevation-hover)')};
  }

  .control:hover:not(:disabled, [aria-disabled='true'])::before {
    opacity: calc(var(--_overlay) * ${sysVar('state-hover-opacity')});
  }

  .control:focus-visible:not(:disabled, [aria-disabled='true'])::before {
    opacity: calc(var(--_overlay) * ${sysVar('state-focus-opacity')});
  }

  .control:active:not(:disabled, [aria-disabled='true'])::before {
    opacity: calc(var(--_overlay) * ${sysVar('state-pressed-opacity')});
  }

  /* Focus stays visible on soft-disabled buttons: they are meant to be reachable. */
  .control:focus-visible {
    outline: ${compVar('button-focus-ring-width', sysVar('size-focus-ring-width'))} solid
      ${compVar('button-focus-ring-color', sysVar('color-focus-ring'))};
    outline-offset: ${compVar('button-focus-ring-offset', sysVar('size-focus-ring-offset'))};
  }

  .control:disabled,
  .control[aria-disabled='true'] {
    background-color: var(--_container-disabled);
    border-color: var(--_border-disabled);
    box-shadow: none;
    color: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
      transparent
    );
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    .control,
    .control::before {
      transition: none;
    }
  }

  /* System colors replace the palette; borders and the focus ring must stay visible. */
  @media (forced-colors: active) {
    .control {
      border-color: ButtonText;
    }

    .control:focus-visible {
      outline-color: Highlight;
    }

    /* The state layer is not visible in forced colors, so hovering changes the border instead. */
    .control:hover:not(:disabled, [aria-disabled='true']) {
      border-color: Highlight;
    }

    .control:disabled,
    .control[aria-disabled='true'] {
      border-color: GrayText;
      color: GrayText;
    }
  }
`;
