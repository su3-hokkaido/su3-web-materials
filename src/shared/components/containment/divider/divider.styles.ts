import { css } from 'lit';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The line is a border, not a background, so it stays visible in forced colors. The public hooks are
// `--su3-comp-divider-*` (see the @cssprop list on Su3Divider).
export const dividerStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  :host([orientation='vertical']) {
    display: inline-block;
    align-self: stretch;
    min-height: ${sysVar('space-4')};
    vertical-align: middle;
  }

  .line {
    box-sizing: border-box;
    border: 0 solid ${compVar('divider-color', sysVar('color-border'))};
  }

  :host(:not([orientation='vertical'])) .line {
    width: 100%;
    border-block-start-width: ${compVar('divider-thickness', sysVar('size-border-width'))};
  }

  :host(:not([orientation='vertical'])[inset]) .line {
    width: auto;
    margin-inline-start: ${compVar('divider-inset', sysVar('space-4'))};
  }

  :host([orientation='vertical']) .line {
    height: 100%;
    border-inline-start-width: ${compVar('divider-thickness', sysVar('size-border-width'))};
  }

  :host([orientation='vertical'][inset]) .line {
    height: auto;
    margin-block: ${compVar('divider-inset', sysVar('space-4'))};
  }

  @media (forced-colors: active) {
    .line {
      border-color: CanvasText;
    }
  }
`;
