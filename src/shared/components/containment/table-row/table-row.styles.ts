import { css } from 'lit';
import { focusRing, focusRingForcedColors } from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The columns come from the table through the private `--_columns` property it sets on itself
// (inherited by its rows); without it the cells share the row equally. The public hooks are
// `--su3-comp-data-table-*`.
export const tableRowStyles = css`
  :host {
    position: relative;
    box-sizing: border-box;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(0, 1fr);
    grid-template-columns: var(--_columns, none);
    align-items: stretch;
    border-block-end: ${sysVar('size-border-width')} solid
      ${compVar('data-table-border-color', sysVar('color-border'))};
    outline: none;
  }

  :host([hidden]) {
    display: none;
  }

  :host([header]) {
    background-color: ${compVar('data-table-container-color', sysVar('color-surface-raised'))};
  }

  :host([selected]) {
    background-color: ${compVar('data-table-selected-color', sysVar('color-accent-subtle'))};
  }

  :host(:focus-visible) {
    ${focusRing('data-table')}
    outline-offset: calc(-1 * ${sysVar('size-focus-ring-width')});
  }

  @media (forced-colors: active) {
    :host {
      border-block-end-color: CanvasText;
    }

    :host([selected]) {
      outline: ${sysVar('size-focus-ring-width')} solid Highlight;
      outline-offset: calc(-1 * ${sysVar('size-focus-ring-width')});
    }

    :host(:focus-visible) {
      ${focusRingForcedColors}
    }
  }
`;
