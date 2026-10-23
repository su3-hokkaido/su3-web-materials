import { css } from 'lit';
import {
  focusRing,
  focusRingForcedColors,
  stateLayerBox,
  stateLayerOpacity,
} from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The public hooks are `--su3-comp-menu-*`; the menu sets them on its surface and the items read
// them. The host is the focus target, so the focus ring and the state layer are drawn from it.
export const menuItemStyles = css`
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

  .item {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: ${sysVar('space-3')};
    min-block-size: ${sysVar('size-control-lg')};
    padding-inline: ${sysVar('space-4')};
    color: ${compVar('menu-label-color', sysVar('color-text'))};
    font-family: ${sysVar('typeface-sans')};
    font-size: ${sysVar('type-label-size')};
    font-weight: ${sysVar('type-body-weight')};
    line-height: ${sysVar('type-label-line-height')};
  }

  .item::before {
    ${stateLayerBox()}
  }

  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .trailing {
    color: ${sysVar('color-text-muted')};
    font-size: ${sysVar('type-label-sm-size')};
  }

  ::slotted([slot='leading']),
  .check {
    flex: none;
    width: ${sysVar('size-icon-md')};
    height: ${sysVar('size-icon-md')};
  }

  .check {
    visibility: hidden;
  }

  .check.checked {
    visibility: visible;
  }

  :host(:hover:not([disabled])) .item::before {
    ${stateLayerOpacity.hover}
  }

  :host(:focus-visible:not([disabled])) .item::before {
    ${stateLayerOpacity.focus}
  }

  :host(:active:not([disabled])) .item::before {
    ${stateLayerOpacity.pressed}
  }

  :host(:focus-visible) {
    ${focusRing('menu')}
    outline-offset: calc(-1 * ${sysVar('size-focus-ring-width')});
  }

  :host([disabled]) {
    cursor: default;
  }

  :host([disabled]) .item {
    color: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
      transparent
    );
  }

  @media (prefers-reduced-motion: reduce) {
    .item::before {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .item {
      color: ButtonText;
    }

    :host(:focus-visible) {
      ${focusRingForcedColors}
    }

    :host([disabled]) .item {
      color: GrayText;
    }
  }
`;
