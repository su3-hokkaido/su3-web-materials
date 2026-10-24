import { css } from 'lit';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The table scrolls when it is limited in height or the columns are wider than it is. The row height
// is the private `--_row-height` property, set by `density` and inherited by the rows and cells; the
// columns are the private `--_columns` property set from `columns`. The public hooks are
// `--su3-comp-data-table-*`.
export const dataTableStyles = css`
  :host {
    --_row-height: ${sysVar('size-control-lg')};

    display: block;
    box-sizing: border-box;
    max-block-size: ${compVar('data-table-max-height', 'none')};
    overflow: auto;
    border: ${sysVar('size-border-width')} solid
      ${compVar('data-table-border-color', sysVar('color-border'))};
    border-radius: ${compVar('data-table-container-shape', sysVar('shape-md'))};
    background-color: ${compVar('data-table-body-color', sysVar('color-surface'))};
    color: ${compVar('data-table-text-color', sysVar('color-text'))};
  }

  :host([hidden]) {
    display: none;
  }

  :host([density='compact']) {
    --_row-height: ${sysVar('size-control-md')};
  }

  /* The last row has no line below it: the table's own border closes it. */
  ::slotted(su3-table-row:last-child) {
    border-block-end-color: transparent;
  }

  :host([sticky-header]) ::slotted(su3-table-row[header]) {
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
  }

  :host([selectable]) ::slotted(su3-table-row:not([header])) {
    cursor: pointer;
  }

  :host([selectable]) ::slotted(su3-table-row:not([header], [selected]):hover) {
    background-color: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('state-hover-opacity')} * 100%),
      transparent
    );
  }

  @media (forced-colors: active) {
    :host {
      border-color: CanvasText;
    }
  }
`;
