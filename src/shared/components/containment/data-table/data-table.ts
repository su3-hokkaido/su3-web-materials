import {
  html,
  LitElement,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import type { Su3TableCell, TableSortDirection } from '../table-cell/table-cell.ts';
import type { Su3TableRow } from '../table-row/table-row.ts';
import { dataTableStyles } from './data-table.styles.ts';

/** How tall the rows are: 48px (`comfortable`) or 40px (`compact`). */
export type DataTableDensity = 'comfortable' | 'compact';

/** Detail of the `sort` event. */
export interface DataTableSortDetail {
  /** The header cell that was activated. */
  cell: Su3TableCell;
  /** The order the column is in now. */
  direction: TableSortDirection;
}

/** Detail of the `select` event. */
export interface DataTableSelectDetail {
  /** The row the user toggled. */
  row: Su3TableRow;
  /** Every selected row, in document order. */
  rows: Su3TableRow[];
}

/** The selector of content inside a row that handles a press by itself (native controls and ARIA roles). */
const INTERACTIVE =
  'a[href], button, input, select, textarea, label, summary, [contenteditable], [role="button"], [role="link"], [role="checkbox"], [role="switch"], [tabindex]:not(su3-table-row, su3-table-cell)';

/**
 * A table of rows and columns. The table element is itself the `table` (its role is set as an
 * attribute on the host, so `aria-label` on the host names it); put `su3-table-row` elements in the
 * default slot, each with `su3-table-cell` elements. A row with `header` holds the column headers.
 * A `selectable` table is a `grid` instead, with `gridcell`s, because only a grid can announce
 * multiple selection.
 *
 * `columns` is a CSS `grid-template-columns` value (`"2fr 1fr 120px"`) shared by every row, so the
 * cells line up; without it the cells of a row share its width equally. A flexible column (`fr`)
 * shrinks and truncates its text; fixed columns that are wider than the table make it scroll
 * sideways. A table that is limited in height (`--su3-comp-data-table-max-height`) also scrolls, and
 * becomes a tab stop while it does so, so the keyboard can scroll it; with `sticky-header` the header
 * row stays visible while the rows scroll. `density` chooses 48px or 40px rows.
 *
 * Sorting: a header cell with `sortable` shows its `sort` direction. Activating it (a click, Enter or
 * Space) cycles it none, ascending, descending, none, resets the other sortable headers to none and
 * fires `sort`; the application orders the rows in response, because only it knows the data. A press
 * on a link or button inside a header cell sorts too.
 *
 * Selecting: with `selectable` a click, Enter or Space on a row toggles its `selected` and fires
 * `select`; any number of rows can be selected. The rows become one tab stop (on the first selected
 * row, else the first row) that moves with ArrowDown, ArrowUp, Home and End. Pressing a link, button
 * or other control inside a row does not toggle the row. Pagination, resizing and reordering columns,
 * editing cells and very long lists (no virtualisation) are not supported.
 *
 * @tagname su3-data-table
 * @summary A table of rows and cells with optional sorting and row selection.
 *
 * @slot - The `su3-table-row` elements.
 *
 * @cssprop [--su3-comp-data-table-container-color] - Background of a header row.
 * @cssprop [--su3-comp-data-table-body-color] - Background of the rows.
 * @cssprop [--su3-comp-data-table-border-color] - Color of the outline and the lines between rows.
 * @cssprop [--su3-comp-data-table-container-shape] - Corner radius of the outline.
 * @cssprop [--su3-comp-data-table-text-color] - Text color.
 * @cssprop [--su3-comp-data-table-header-color] - Text color of the header cells.
 * @cssprop [--su3-comp-data-table-selected-color] - Background of a selected row.
 * @cssprop [--su3-comp-data-table-max-height] - Height above which the table scrolls.
 *
 * @fires sort - The user changed the order of a column (`detail.cell`, `detail.direction`).
 * @fires select - The user toggled a row (`detail.row`, `detail.rows`). Both bubble but are not
 * composed.
 */
export class Su3DataTable extends LitElement {
  static override styles = dataTableStyles;

  static override properties: PropertyDeclarations = {
    columns: {},
    selectable: { type: Boolean, reflect: true },
    stickyHeader: { type: Boolean, reflect: true, attribute: 'sticky-header' },
    density: { reflect: true },
  };

  /** The `grid-template-columns` value shared by every row. Empty shares the width equally. */
  declare columns: string;

  /** Lets the user select rows. */
  declare selectable: boolean;

  /** Keeps the header row at the top while the rows scroll. */
  declare stickyHeader: boolean;

  /** The height of the rows. */
  declare density: DataTableDensity;

  /** The rows whose `tabindex` this table set, so only those are cleared again. */
  readonly #managed = new WeakSet<Su3TableRow>();
  #ownTabindex = false;
  readonly #observer = new ResizeObserver(() => {
    this.#syncScrollable();
  });

  constructor() {
    super();
    this.columns = '';
    this.selectable = false;
    this.stickyHeader = false;
    this.density = 'comfortable';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // The role is there from the start, before the first render.
    this.setAttribute('role', this.selectable ? 'grid' : 'table');
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeyDown);
    this.addEventListener('su3-table-row-change', this.#onRowChange);
    this.#observer.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeyDown);
    this.removeEventListener('su3-table-row-change', this.#onRowChange);
    this.#observer.disconnect();
  }

  protected override willUpdate(): void {
    this.setAttribute('role', this.selectable ? 'grid' : 'table');
    if (this.selectable) this.setAttribute('aria-multiselectable', 'true');
    else this.removeAttribute('aria-multiselectable');
    if (this.columns === '') this.style.removeProperty('--_columns');
    else this.style.setProperty('--_columns', this.columns);
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('selectable')) {
      // Rows carry `aria-selected` and cells their grid role only in a selectable table.
      for (const row of this.#rows()) {
        row.requestUpdate();
        for (const cell of row.cells()) cell.requestUpdate();
      }
      this.#syncTabStops();
    }
    this.#syncScrollable();
  }

  #rows(): Su3TableRow[] {
    return [...this.children].filter(
      (child): child is Su3TableRow => child.localName === 'su3-table-row',
    );
  }

  #bodyRows(): Su3TableRow[] {
    return this.#rows().filter((row) => !row.header);
  }

  /**
   * One tab stop over the rows of a selectable table: the first selected row, else the first. A row
   * that has focus keeps its stop, so a change elsewhere never takes the keyboard's place away.
   */
  #syncTabStops(): void {
    const rows = this.#bodyRows();
    const focused = rows.find((row) => row === document.activeElement);
    const stop = focused ?? rows.find((row) => row.selected) ?? rows[0];
    for (const row of rows) {
      if (this.selectable) {
        row.tabIndex = row === stop ? 0 : -1;
        this.#managed.add(row);
      } else if (this.#managed.has(row)) {
        row.removeAttribute('tabindex');
        this.#managed.delete(row);
      }
    }
  }

  /** A table that scrolls is a tab stop, so a keyboard user can scroll it (unless it has its own). */
  #syncScrollable(): void {
    const scrollable = this.scrollHeight > this.clientHeight || this.scrollWidth > this.clientWidth;
    if (scrollable && !this.hasAttribute('tabindex')) {
      this.tabIndex = 0;
      this.#ownTabindex = true;
    } else if (!scrollable && this.#ownTabindex) {
      this.removeAttribute('tabindex');
      this.#ownTabindex = false;
    }
  }

  /** A row was selected or became the header from code: the tab stop follows. */
  #onRowChange = (): void => {
    this.#syncTabStops();
  };

  /** The cell an event passed through on its way up to this table. */
  #cellOf(event: Event): Su3TableCell | undefined {
    return event
      .composedPath()
      .find(
        (node): node is Su3TableCell =>
          node instanceof Element && node.localName === 'su3-table-cell',
      );
  }

  /** The row an event passed through on its way up to this table. */
  #rowOf(event: Event): Su3TableRow | undefined {
    return event
      .composedPath()
      .find(
        (node): node is Su3TableRow =>
          node instanceof Element && node.localName === 'su3-table-row',
      );
  }

  /**
   * Whether a control inside the row took the press: any element between the target and the row that
   * is a native control or has an interactive role. The path includes the inside of a component such
   * as `su3-button`, so its inner button is found.
   */
  #pressedControl(event: Event, row: Su3TableRow): boolean {
    for (const node of event.composedPath()) {
      if (node === row) return false;
      if (node instanceof Element && node.matches(INTERACTIVE)) return true;
    }
    return false;
  }

  #cycleSort(cell: Su3TableCell): void {
    const next: TableSortDirection =
      cell.sort === 'none' ? 'ascending' : cell.sort === 'ascending' ? 'descending' : 'none';
    for (const row of this.#rows()) {
      if (!row.header) continue;
      for (const other of row.cells()) if (other !== cell && other.sortable) other.sort = 'none';
    }
    cell.sort = next;
    this.dispatchEvent(
      new CustomEvent<DataTableSortDetail>('sort', {
        detail: { cell, direction: next },
        bubbles: true,
      }),
    );
  }

  #toggle(row: Su3TableRow): void {
    row.selected = !row.selected;
    const rows = this.#bodyRows().filter((candidate) => candidate.selected);
    this.dispatchEvent(
      new CustomEvent<DataTableSelectDetail>('select', { detail: { row, rows }, bubbles: true }),
    );
  }

  #onClick = (event: MouseEvent): void => {
    const cell = this.#cellOf(event);
    if (cell?.header && cell.sortable) {
      this.#cycleSort(cell);
      return;
    }
    const row = this.#rowOf(event);
    if (!this.selectable || !row || row.header) return;
    // A press on a control inside the row is for that control.
    if (this.#pressedControl(event, row)) return;
    this.#toggle(row);
  };

  #onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const activation = event.key === 'Enter' || event.key === ' ';
    if (target instanceof HTMLElement && target.localName === 'su3-table-cell') {
      const cell = target as Su3TableCell;
      if (cell.header && cell.sortable && activation) {
        event.preventDefault();
        this.#cycleSort(cell);
      }
      return;
    }
    if (!this.selectable || target.localName !== 'su3-table-row') return;
    const row = target as Su3TableRow;
    if (row.header) return;
    const rows = this.#bodyRows();
    const index = rows.indexOf(row);
    const move = (to: number): void => {
      event.preventDefault();
      const next = rows[Math.min(Math.max(to, 0), rows.length - 1)];
      if (!next) return;
      // The tab stop follows the focus, so Tab out and back returns to the same row.
      for (const other of rows) other.tabIndex = other === next ? 0 : -1;
      next.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        move(index + 1);
        return;
      case 'ArrowUp':
        move(index - 1);
        return;
      case 'Home':
        move(0);
        return;
      case 'End':
        move(rows.length - 1);
        return;
      default:
        if (activation) {
          event.preventDefault();
          this.#toggle(row);
        }
    }
  };

  protected override render(): TemplateResult {
    return html`<slot
      @slotchange=${() => {
        this.#syncTabStops();
        this.#syncScrollable();
      }}
    ></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-data-table': Su3DataTable;
  }
}
