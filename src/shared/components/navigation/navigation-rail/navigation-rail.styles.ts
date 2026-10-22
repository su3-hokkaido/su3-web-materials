import { css } from 'lit';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The default width is the item's pill (control-lg + space-4) plus space-2 of room on each side.
const defaultWidth = css`calc(${sysVar('size-control-lg')} + ${sysVar('space-4')} + 2 * ${sysVar('space-2')})`;

export const navigationRailStyles = css`
  :host {
    display: block;
    inline-size: ${compVar('navigation-rail-width', defaultWidth)};
    block-size: 100%;
  }

  :host([hidden]) {
    display: none;
  }

  .nav {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    inline-size: 100%;
    block-size: 100%;
    padding-block: ${sysVar('space-3')};
    background-color: ${compVar('navigation-rail-container-color', sysVar('color-surface-raised'))};
    border-inline-end: ${sysVar('size-border-width')} solid
      ${compVar('navigation-rail-border-color', sysVar('color-border'))};
  }

  /* Shown only while something is slotted, so an unused header takes no space. */
  .header {
    display: none;
    flex-direction: column;
    align-items: center;
    margin-block-end: ${sysVar('space-3')};
  }

  .header.filled {
    display: flex;
  }

  .items {
    display: flex;
    flex-direction: column;
    gap: ${compVar('navigation-rail-item-gap', sysVar('space-3'))};
  }

  /* The item is a flex child of the bar by default; in the rail it keeps its own height. */
  ::slotted(su3-navigation-item) {
    flex: none;
  }

  @media (forced-colors: active) {
    .nav {
      border-inline-end-color: CanvasText;
    }
  }
`;
