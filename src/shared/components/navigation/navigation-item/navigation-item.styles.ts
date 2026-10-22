import { css } from 'lit';
import {
  focusRing,
  focusRingForcedColors,
  stateLayerBox,
  stateLayerOpacity,
} from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// Private custom properties (`--_*`) carry the per-state defaults. The public hooks are
// `--su3-comp-navigation-bar-*`, which win over those defaults when set (see the @cssprop list on
// Su3NavigationItem).
export const navigationItemStyles = css`
  :host {
    display: flex;
    flex: 1 1 0;
    min-width: 0;
  }

  :host([hidden]) {
    display: none;
  }

  .control {
    --_label: ${sysVar('color-text-muted')};
    --_icon: ${sysVar('color-text-muted')};
    --_indicator: transparent;

    position: relative;
    box-sizing: border-box;
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: ${sysVar('space-1')};
    min-width: 0;
    margin: 0;
    padding-block: ${sysVar('space-3')};
    padding-inline: ${sysVar('space-2')};
    border: 0;
    background: none;
    color: ${compVar('navigation-bar-label-color', 'var(--_label)')};
    font-family: ${sysVar('typeface-sans')};
    font-size: ${sysVar('type-label-sm-size')};
    font-weight: ${sysVar('type-label-weight')};
    line-height: ${sysVar('type-label-sm-line-height')};
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  :host([selected]) .control {
    --_label: ${compVar('navigation-bar-selected-label-color', sysVar('color-text'))};
    --_icon: ${compVar('navigation-bar-indicator-icon-color', sysVar('color-on-accent-subtle'))};
    --_indicator: ${compVar('navigation-bar-indicator-color', sysVar('color-accent-subtle'))};
  }

  /* The pill: the state layer is drawn on it, so hover and focus show on the icon area. */
  .indicator {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: calc(${sysVar('size-control-lg')} + ${sysVar('space-4')});
    height: ${sysVar('size-control-sm')};
    border-radius: ${compVar('navigation-bar-indicator-shape', sysVar('shape-pill'))};
    background-color: var(--_indicator);
    color: var(--_icon);
    transition: background-color ${sysVar('motion-duration-fast')}
      ${sysVar('motion-easing-standard')};
  }

  .indicator::before {
    ${stateLayerBox()}
  }

  ::slotted([slot='icon']) {
    width: ${sysVar('size-icon-lg')};
    height: ${sysVar('size-icon-lg')};
    flex: none;
  }

  .badge {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 50%;
    margin-inline-start: ${sysVar('space-1')};
    transform: translateY(-25%);
  }

  .label {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .control:hover:not(:disabled, [aria-disabled='true']) .indicator::before {
    ${stateLayerOpacity.hover}
  }

  .control:focus-visible:not(:disabled, [aria-disabled='true']) .indicator::before {
    ${stateLayerOpacity.focus}
  }

  .control:active:not(:disabled, [aria-disabled='true']) .indicator::before {
    ${stateLayerOpacity.pressed}
  }

  .control:focus-visible {
    ${focusRing('navigation-bar')}
    outline-offset: calc(-1 * ${sysVar('size-focus-ring-width')});
  }

  .control:disabled,
  .control[aria-disabled='true'] {
    color: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
      transparent
    );
    cursor: default;
  }

  .control:disabled .indicator,
  .control[aria-disabled='true'] .indicator {
    color: inherit;
  }

  /*
   * Inline layout (drawer): the label sits beside the icon and the pill, with its state layer, is
   * the whole control. The indicator wrapper only keeps the icon and the badge together.
   */
  :host([layout='inline']) .control {
    flex-direction: row;
    gap: ${sysVar('space-3')};
    min-block-size: ${sysVar('size-control-lg')};
    padding-block: 0;
    padding-inline: ${sysVar('space-4')};
    border-radius: ${compVar('navigation-bar-indicator-shape', sysVar('shape-pill'))};
    background-color: var(--_indicator);
    font-size: ${sysVar('type-label-size')};
    line-height: ${sysVar('type-label-line-height')};
    text-align: start;
    transition: background-color ${sysVar('motion-duration-fast')}
      ${sysVar('motion-easing-standard')};
  }

  :host([layout='inline']) .control::before {
    ${stateLayerBox()}
  }

  :host([layout='inline']) .indicator {
    display: contents;
    background-color: transparent;
  }

  :host([layout='inline']) .indicator::before {
    display: none;
  }

  :host([layout='inline']) .label {
    flex: 1;
    text-align: start;
  }

  :host([layout='inline']) .badge {
    inset-inline: auto ${sysVar('space-4')};
    inset-block-start: 50%;
    margin-inline-start: 0;
    transform: translateY(-50%);
  }

  :host([layout='inline']) .control:hover:not(:disabled, [aria-disabled='true'])::before {
    ${stateLayerOpacity.hover}
  }

  :host([layout='inline']) .control:focus-visible:not(:disabled, [aria-disabled='true'])::before {
    ${stateLayerOpacity.focus}
  }

  :host([layout='inline']) .control:active:not(:disabled, [aria-disabled='true'])::before {
    ${stateLayerOpacity.pressed}
  }

  @media (prefers-reduced-motion: reduce) {
    .indicator,
    .indicator::before,
    :host([layout='inline']) .control,
    :host([layout='inline']) .control::before {
      transition: none;
    }
  }

  /* System colors replace the palette: the selected pill is outlined with Highlight. */
  @media (forced-colors: active) {
    .control {
      color: ButtonText;
    }

    :host([selected]) .indicator {
      border: ${sysVar('size-focus-ring-width')} solid Highlight;
    }

    :host([selected][layout='inline']) .indicator {
      border: 0;
    }

    :host([selected][layout='inline']) .control {
      border: ${sysVar('size-focus-ring-width')} solid Highlight;
    }

    .control:focus-visible {
      ${focusRingForcedColors}
    }

    .control:disabled,
    .control[aria-disabled='true'] {
      color: GrayText;
    }
  }
`;
