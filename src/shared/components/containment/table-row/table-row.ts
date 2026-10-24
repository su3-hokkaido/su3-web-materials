import {
  html,
  LitElement,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import type { Su3TableCell } from '../table-cell/table-cell.ts';
import { tableRowStyles } from './table-row.styles.ts';

/**
 * One row of a `su3-data-table`: a grid of `su3-table-cell` elements laid out in the table's columns.
 * The element sets `role="row"` as an attribute on the host. A `header` row holds the column headers
 * and makes its cells `columnheader`s; `selected` marks a chosen row of a selectable table
 * (`aria-selected`). Selecting rows is handled by the table.
 *
 * @fires su3-table-row-change - `selected` or `header` changed. The table listens to it to keep its
 * tab stop in step. Internal: it does not leave the table.
 *
 * @tagname su3-table-row
 * @summary One row of a data table.
 *
 * @slot - The `su3-table-cell` elements.
 *
 * @cssprop [--su3-comp-data-table-container-color] - Background of a header row.
 * @cssprop [--su3-comp-data-table-border-color] - Color of the line below the row.
 * @cssprop [--su3-comp-data-table-selected-color] - Background of a selected row.
 * @cssprop [--su3-comp-data-table-focus-ring-color] - Focus indicator color.
 * @cssprop [--su3-comp-data-table-focus-ring-width] - Focus indicator thickness.
 */
export class Su3TableRow extends LitElement {
  static override styles = tableRowStyles;

  static override properties: PropertyDeclarations = {
    header: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
  };

  /** Makes this the header row: its cells are column headers. */
  declare header: boolean;

  /** Whether a selectable table has this row selected. */
  declare selected: boolean;

  constructor() {
    super();
    this.header = false;
    this.selected = false;
  }

  /** The cells of this row. */
  cells(): Su3TableCell[] {
    return [...this.children].filter(
      (child): child is Su3TableCell => child.localName === 'su3-table-cell',
    );
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // The role is there from the start, before the first render.
    this.setAttribute('role', 'row');
  }

  protected override willUpdate(): void {
    this.setAttribute('role', 'row');
    // Only a row of a selectable table is selectable, so only it carries `aria-selected`.
    const selectable = this.parentElement?.hasAttribute('selectable') === true && !this.header;
    if (selectable) this.setAttribute('aria-selected', String(this.selected));
    else this.removeAttribute('aria-selected');
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('header')) this.#syncCells();
    // The table keeps its tab stop in step with the rows, also when a row is changed from code.
    if (this.#updatedOnce && (changed.has('selected') || changed.has('header'))) {
      this.dispatchEvent(new Event('su3-table-row-change', { bubbles: true }));
    }
    this.#updatedOnce = true;
  }

  #updatedOnce = false;

  /** The header row makes its cells column headers. */
  #syncCells(): void {
    for (const cell of this.cells()) cell.header = this.header;
  }

  protected override render(): TemplateResult {
    return html`<slot
      @slotchange=${() => {
        this.#syncCells();
      }}
    ></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-table-row': Su3TableRow;
  }
}
