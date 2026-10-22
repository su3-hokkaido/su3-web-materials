import { css } from 'lit';
import { compVar, sysVar } from '../../../tokens/index.ts';

export const navigationBarStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  .nav {
    box-sizing: border-box;
    display: flex;
    align-items: stretch;
    width: 100%;
    background-color: ${compVar('navigation-bar-container-color', sysVar('color-surface-raised'))};
    border-block-start: ${sysVar('size-border-width')} solid
      ${compVar('navigation-bar-border-color', sysVar('color-border'))};
  }

  @media (forced-colors: active) {
    .nav {
      border-block-start-color: CanvasText;
    }
  }
`;
