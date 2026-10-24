import {
  html,
  LitElement,
  nothing,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { tableCellStyles } from './table-cell.styles.ts';

/** The order a sortable column is in: not sorted, smallest first or largest first. */
export type TableSortDirection = 'none' | 'ascending' | 'descending';

/** How the content of a cell is aligned along the row. */
export type TableCellAlign = 'start' | 'center' | 'end';

/**
 * One cell of a `su3-table-row` in a `su3-data-table`. The element sets its own role as an attribute
 * on the host: `columnheader` in a header row (the row sets `header`), `cell` otherwise (`gridcell`
 * in a selectable table, which is a grid). Put the
 * content in the default slot: text, or a link, a badge, a button.
 *
 * A header cell can be `sortable`: it becomes a tab stop that shows its `sort` direction as an arrow
 * and exposes it as `aria-sort`; activating it with the pointer, Enter or Space asks the table to
 * change the order (see `su3-data-table`). The cell only shows the direction; ordering the rows is
 * the application's job.
 *
 * @tagname su3-table-cell
 * @summary One cell of a data table row.
 *
 * @slot - The content of the cell.
 *
 * @csspart content - The wrapper around the content.
 *
 * @cssprop [--su3-comp-data-table-text-color] - Text color of a cell.
 * @cssprop [--su3-comp-data-table-header-color] - Text color of a header cell.
 * @cssprop [--su3-comp-data-table-focus-ring-color] - Focus indicator color.
 * @cssprop [--su3-comp-data-table-focus-ring-width] - Focus indicator thickness.
 */
export class Su3TableCell extends LitElement {
  static override styles = tableCellStyles;

  static override properties: PropertyDeclarations = {
    header: { type: Boolean, reflect: true },
    align: { reflect: true },
    sortable: { type: Boolean, reflect: true },
    sort: { reflect: true },
  };

  /** Makes this a column header. A header row sets it on its cells. */
  declare header: boolean;

  /** How the content is aligned along the row. */
  declare align: TableCellAlign;

  /** Lets the user change the order by activating this header cell. Only for header cells. */
  declare sortable: boolean;

  /** The order the column is in, shown as an arrow and exposed as `aria-sort`. */
  declare sort: TableSortDirection;

  constructor() {
    super();
    this.header = false;
    this.align = 'start';
    this.sortable = false;
    this.sort = 'none';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // The header row decides before the first render, so the role is right from the start.
    if (
      this.parentElement?.localName === 'su3-table-row' &&
      this.parentElement.hasAttribute('header')
    ) {
      this.header = true;
    }
    this.setAttribute('role', this.#role());
  }

  /** `columnheader` in a header row, else `gridcell` in a selectable table (a grid), else `cell`. */
  #role(): string {
    if (this.header) return 'columnheader';
    return this.closest('su3-data-table')?.hasAttribute('selectable') === true
      ? 'gridcell'
      : 'cell';
  }

  protected override willUpdate(changed: PropertyValues): void {
    this.setAttribute('role', this.#role());
    const sortable = this.header && this.sortable;
    if (sortable) this.setAttribute('aria-sort', this.sort);
    else this.removeAttribute('aria-sort');
    // A sortable header is a tab stop; other cells are not focusable.
    if (changed.has('sortable') || changed.has('header')) {
      if (sortable) this.tabIndex = 0;
      else this.removeAttribute('tabindex');
    }
  }

  protected override render(): TemplateResult {
    const arrow = this.sort === 'descending' ? 'M12 5v14M6 13l6 6 6-6' : 'M12 19V5M6 11l6-6 6 6';
    return html`<span class="content" part="content"><slot></slot></span>${
        this.header && this.sortable
          ? html`<svg
              class="sort"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d=${arrow} />
            </svg>`
          : nothing
      }`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-table-cell': Su3TableCell;
  }
}
