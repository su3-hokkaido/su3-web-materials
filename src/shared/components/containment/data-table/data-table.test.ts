import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../buttons/button/index.ts';
import './index.ts';
import type { Su3TableCell } from '../table-cell/table-cell.ts';
import type { Su3TableRow } from '../table-row/table-row.ts';
import type { DataTableSelectDetail, DataTableSortDetail, Su3DataTable } from './data-table.ts';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function render(markup: string): Promise<Su3DataTable> {
  document.body.innerHTML = markup;
  const table = document.querySelector('su3-data-table');
  if (!table) throw new Error('No su3-data-table was rendered');
  await table.updateComplete;
  await wait(30);
  await table.updateComplete;
  return table;
}

const rows = (table: Su3DataTable): Su3TableRow[] => [...table.querySelectorAll('su3-table-row')];
const bodyRows = (table: Su3DataTable): Su3TableRow[] => rows(table).filter((row) => !row.header);
const headers = (table: Su3DataTable): Su3TableCell[] => [
  ...table.querySelectorAll<Su3TableCell>('su3-table-row[header] su3-table-cell'),
];

function isSort(value: unknown): value is DataTableSortDetail {
  return typeof value === 'object' && value !== null && 'direction' in value;
}
function isSelect(value: unknown): value is DataTableSelectDetail {
  return typeof value === 'object' && value !== null && 'rows' in value;
}

const basic = (
  attributes = '',
  style = '',
): string => `<su3-data-table aria-label="People" ${attributes}
  style="${style}">
  <su3-table-row header>
    <su3-table-cell sortable>Name</su3-table-cell>
    <su3-table-cell sortable>Role</su3-table-cell>
    <su3-table-cell align="end">Score</su3-table-cell>
  </su3-table-row>
  <su3-table-row><su3-table-cell>Ada</su3-table-cell><su3-table-cell>Engineer</su3-table-cell><su3-table-cell align="end">98</su3-table-cell></su3-table-row>
  <su3-table-row><su3-table-cell>Grace</su3-table-cell><su3-table-cell>Admiral</su3-table-cell><su3-table-cell align="end">95</su3-table-cell></su3-table-row>
  <su3-table-row><su3-table-cell>Alan</su3-table-cell><su3-table-cell>Researcher</su3-table-cell><su3-table-cell align="end">92</su3-table-cell></su3-table-row>
</su3-data-table>`;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('structure', () => {
  it('is a named table of rows, column headers and cells', async () => {
    await render(basic());
    await expect.element(page.getByRole('table', { name: 'People' })).toBeVisible();
    expect(page.getByRole('row').elements()).toHaveLength(4);
    expect(page.getByRole('columnheader').elements()).toHaveLength(3);
    await expect.element(page.getByRole('cell', { name: 'Ada' })).toBeVisible();
  });

  it('lays the cells out in the columns of every row, aligned with the header', async () => {
    const table = await render(basic('columns="2fr 1fr 80px"', 'width: 600px'));
    const lefts = (row: Su3TableRow): number[] =>
      row.cells().map((cell) => Math.round(cell.getBoundingClientRect().left));
    const [header, first, second] = rows(table);
    if (!header || !first || !second) throw new Error('No rows');
    expect(lefts(first)).toEqual(lefts(header));
    expect(lefts(second)).toEqual(lefts(header));
    const widths = first.cells().map((cell) => Math.round(cell.getBoundingClientRect().width));
    expect(widths[2]).toBe(80);
    expect(widths[0]).toBeGreaterThan((widths[1] ?? 0) * 1.9);
  });

  it('shares the width equally between cells without columns', async () => {
    const table = await render(basic('', 'width: 600px'));
    const widths = rows(table)[1]
      ?.cells()
      .map((cell) => Math.round(cell.getBoundingClientRect().width));
    expect(new Set(widths).size).toBe(1);
  });

  it('follows a change of columns', async () => {
    const table = await render(basic('columns="100px 100px 100px"', 'width: 600px'));
    table.columns = '300px 100px 100px';
    await table.updateComplete;
    expect(Math.round(rows(table)[1]?.cells()[0]?.getBoundingClientRect().width ?? 0)).toBe(300);
    table.columns = '';
    await table.updateComplete;
    expect(table.style.getPropertyValue('--_columns')).toBe('');
  });

  it('is 48px per row, or 40px when compact', async () => {
    const table = await render(basic());
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    // The cell, not the row: the row adds a line below it.
    const height = (): number => rows(table)[1]?.cells()[0]?.getBoundingClientRect().height ?? 0;
    expect(Math.round(height())).toBe(Math.round(3 * rem));
    table.density = 'compact';
    await table.updateComplete;
    expect(Math.round(height())).toBe(Math.round(2.5 * rem));
  });

  it('draws an outline and follows the border and body hooks', async () => {
    const table = await render(
      basic(
        '',
        '--su3-comp-data-table-border-color: rgb(1, 2, 3); --su3-comp-data-table-body-color: rgb(4, 5, 6)',
      ),
    );
    expect(getComputedStyle(table).borderTopColor).toBe('rgb(1, 2, 3)');
    expect(getComputedStyle(table).backgroundColor).toBe('rgb(4, 5, 6)');
  });
});

describe('sorting', () => {
  it('cycles none, ascending, descending, none and fires sort each time', async () => {
    const table = await render(basic());
    const seen: string[] = [];
    table.addEventListener('sort', (event) => {
      if (event instanceof CustomEvent && isSort(event.detail)) {
        seen.push(`${event.detail.cell.textContent.trim()}:${event.detail.direction}`);
      }
    });
    const name = page.getByRole('columnheader', { name: 'Name' });
    await name.click();
    await expect.element(name).toHaveAttribute('aria-sort', 'ascending');
    await name.click();
    await expect.element(name).toHaveAttribute('aria-sort', 'descending');
    await name.click();
    await expect.element(name).toHaveAttribute('aria-sort', 'none');
    expect(seen).toEqual(['Name:ascending', 'Name:descending', 'Name:none']);
  });

  it('keeps one sorted column: sorting another resets the first', async () => {
    const table = await render(basic());
    await page.getByRole('columnheader', { name: 'Name' }).click();
    await page.getByRole('columnheader', { name: 'Role' }).click();
    expect(headers(table).map((cell) => cell.sort)).toEqual(['none', 'ascending', 'none']);
  });

  it('sorts with Enter and with Space on a focused header', async () => {
    const table = await render(basic());
    const seen: string[] = [];
    table.addEventListener('sort', () => seen.push('sort'));
    headers(table)[0]?.focus();
    await userEvent.keyboard('{Enter}');
    expect(headers(table)[0]?.sort).toBe('ascending');
    await userEvent.keyboard(' ');
    expect(headers(table)[0]?.sort).toBe('descending');
    expect(seen).toHaveLength(2);
  });

  it('does not sort a header that is not sortable, and leaves it out of the tab order', async () => {
    const table = await render(basic());
    const seen: string[] = [];
    table.addEventListener('sort', () => seen.push('sort'));
    await page.getByRole('columnheader', { name: 'Score' }).click();
    expect(seen).toEqual([]);
    expect(headers(table)[2]?.hasAttribute('tabindex')).toBe(false);
  });

  it('does not reorder the rows itself', async () => {
    const table = await render(basic());
    await page.getByRole('columnheader', { name: 'Name' }).click();
    expect(bodyRows(table).map((row) => row.cells()[0]?.textContent.trim())).toEqual([
      'Ada',
      'Grace',
      'Alan',
    ]);
  });
});

describe('selecting', () => {
  it('toggles a row on a click, with aria-selected, and fires select with every selected row', async () => {
    const table = await render(basic('selectable'));
    await expect.element(page.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true');
    const seen: string[][] = [];
    table.addEventListener('select', (event) => {
      if (event instanceof CustomEvent && isSelect(event.detail)) {
        seen.push(event.detail.rows.map((row) => row.cells()[0]?.textContent.trim() ?? ''));
      }
    });
    await page.getByRole('gridcell', { name: 'Grace' }).click();
    await page.getByRole('gridcell', { name: 'Alan' }).click();
    expect(bodyRows(table).map((row) => row.selected)).toEqual([false, true, true]);
    expect(bodyRows(table).map((row) => row.getAttribute('aria-selected'))).toEqual([
      'false',
      'true',
      'true',
    ]);
    await page.getByRole('gridcell', { name: 'Grace' }).click();
    expect(seen).toEqual([['Grace'], ['Grace', 'Alan'], ['Alan']]);
  });

  it('does nothing without selectable, and carries no aria-selected', async () => {
    const table = await render(basic());
    await page.getByRole('cell', { name: 'Grace' }).click();
    expect(bodyRows(table).map((row) => row.selected)).toEqual([false, false, false]);
    expect(bodyRows(table)[0]?.hasAttribute('aria-selected')).toBe(false);
    await expect.element(page.getByRole('table')).not.toHaveAttribute('aria-multiselectable');
    await expect.element(page.getByRole('cell', { name: 'Grace' })).toBeVisible();
  });

  it('does not select the header row, and a press on a control inside a row is not a selection', async () => {
    const table = await render(
      `<su3-data-table selectable aria-label="Orders">
        <su3-table-row header><su3-table-cell>Order</su3-table-cell></su3-table-row>
        <su3-table-row><su3-table-cell><button>Open</button></su3-table-cell></su3-table-row>
      </su3-data-table>`,
    );
    await page.getByRole('columnheader', { name: 'Order' }).click();
    await page.getByRole('button', { name: 'Open' }).click();
    expect(rows(table).map((row) => row.selected)).toEqual([false, false]);
  });

  it('has its roles from the first frame, with the header cells already column headers', () => {
    const element = document.createElement('div');
    element.innerHTML =
      '<su3-data-table aria-label="T"><su3-table-row header><su3-table-cell>A</su3-table-cell></su3-table-row></su3-data-table>';
    document.body.append(element);
    const table = element.querySelector('su3-data-table');
    const cell = element.querySelector('su3-table-cell');
    expect(table?.getAttribute('role')).toBe('table');
    expect(element.querySelector('su3-table-row')?.getAttribute('role')).toBe('row');
    expect(cell?.getAttribute('role')).toBe('columnheader');
    element.remove();
  });

  it('turns aria-selected on and off when selectable changes', async () => {
    const table = await render(basic());
    table.selectable = true;
    await table.updateComplete;
    await wait(30);
    expect(bodyRows(table)[0]?.getAttribute('aria-selected')).toBe('false');
    table.selectable = false;
    await table.updateComplete;
    await wait(30);
    expect(bodyRows(table)[0]?.hasAttribute('aria-selected')).toBe(false);
  });

  it('has one tab stop over the rows: the first selected row, else the first, following code', async () => {
    const table = await render(basic('selectable'));
    const stops = (): (string | null)[] =>
      bodyRows(table).map((row) => row.getAttribute('tabindex'));
    expect(stops()).toEqual(['0', '-1', '-1']);
    const third = bodyRows(table)[2];
    if (!third) throw new Error('No row');
    third.selected = true;
    await third.updateComplete;
    await table.updateComplete;
    expect(stops()).toEqual(['-1', '-1', '0']);
  });

  it('keeps a tab stop that the keyboard moved when only density or columns change', async () => {
    const table = await render(basic('selectable'));
    bodyRows(table)[0]?.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    table.density = 'compact';
    table.columns = '1fr 1fr 1fr';
    await table.updateComplete;
    expect(bodyRows(table).map((row) => row.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
  });

  it('gives rows no tabindex in a table that is not selectable, and clears only its own', async () => {
    const table = await render(basic());
    expect(bodyRows(table).every((row) => !row.hasAttribute('tabindex'))).toBe(true);
    bodyRows(table)[1]?.setAttribute('tabindex', '5');
    table.selectable = true;
    await table.updateComplete;
    table.selectable = false;
    await table.updateComplete;
    // The row got a tab stop from the table and lost it again; the others never kept one.
    expect(bodyRows(table).every((row) => !row.hasAttribute('tabindex'))).toBe(true);
  });

  it('is a grid with gridcells only while selectable, and a table with cells otherwise', async () => {
    const table = await render(basic());
    expect(table.getAttribute('role')).toBe('table');
    expect(bodyRows(table)[0]?.cells()[0]?.getAttribute('role')).toBe('cell');
    table.selectable = true;
    await table.updateComplete;
    await wait(30);
    expect(table.getAttribute('role')).toBe('grid');
    expect(bodyRows(table)[0]?.cells()[0]?.getAttribute('role')).toBe('gridcell');
    expect(headers(table)[0]?.getAttribute('role')).toBe('columnheader');
  });

  it('does not select a row when a su3-button inside it is pressed', async () => {
    const table = await render(
      `<su3-data-table selectable aria-label="Orders">
        <su3-table-row header><su3-table-cell>Order</su3-table-cell><su3-table-cell>Action</su3-table-cell></su3-table-row>
        <su3-table-row><su3-table-cell>#1</su3-table-cell><su3-table-cell><su3-button>Open</su3-button></su3-table-cell></su3-table-row>
      </su3-data-table>`,
    );
    await page.getByRole('button', { name: 'Open' }).click();
    expect(bodyRows(table)[0]?.selected).toBe(false);
    await page.getByRole('gridcell', { name: '#1' }).click();
    expect(bodyRows(table)[0]?.selected).toBe(true);
  });

  it('still selects rows when the table sits inside a label or a tab stop', async () => {
    const table = await render(
      `<div tabindex="0"><su3-data-table selectable aria-label="Orders">
        <su3-table-row><su3-table-cell>#1</su3-table-cell></su3-table-row>
      </su3-data-table></div>`,
    );
    await page.getByRole('gridcell', { name: '#1' }).click();
    expect(bodyRows(table)[0]?.selected).toBe(true);
  });

  it('moves between rows with the arrow keys, Home and End, and toggles with Space and Enter', async () => {
    const table = await render(basic('selectable'));
    const [first, second, third] = bodyRows(table);
    if (!first || !second || !third) throw new Error('No rows');
    first.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(second);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(third);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(third);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(first);
    await userEvent.keyboard(' ');
    expect(first.selected).toBe(true);
    await userEvent.keyboard('{Enter}');
    expect(first.selected).toBe(false);
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(first);
  });

  it('keeps the tab stop on the row that has focus', async () => {
    const table = await render(basic('selectable'));
    bodyRows(table)[0]?.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(bodyRows(table).map((row) => row.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
  });

  it('tints a selected row and follows the selected hook', async () => {
    const table = await render(
      basic('selectable', '--su3-comp-data-table-selected-color: rgb(1, 2, 3)'),
    );
    await page.getByRole('gridcell', { name: 'Ada' }).click();
    expect(getComputedStyle(bodyRows(table)[0] as Su3TableRow).backgroundColor).toBe(
      'rgb(1, 2, 3)',
    );
  });
});

describe('scrolling', () => {
  const tall = (attributes = ''): string =>
    `<su3-data-table aria-label="Long" ${attributes} style="--su3-comp-data-table-max-height: 160px; width: 300px">
      <su3-table-row header><su3-table-cell>Name</su3-table-cell></su3-table-row>
      ${Array.from({ length: 20 }, (_, index) => `<su3-table-row><su3-table-cell>Row ${String(index)}</su3-table-cell></su3-table-row>`).join('')}
    </su3-data-table>`;

  it('scrolls when it is limited in height', async () => {
    const table = await render(tall());
    expect(Math.round(table.getBoundingClientRect().height)).toBe(160);
    expect(table.scrollHeight).toBeGreaterThan(table.clientHeight);
  });

  it('keeps the header row at the top with sticky-header, and lets it scroll away without', async () => {
    const sticky = await render(tall('sticky-header'));
    sticky.scrollTop = 200;
    await wait(50);
    const header = rows(sticky)[0] as Su3TableRow;
    expect(Math.round(header.getBoundingClientRect().top)).toBe(
      Math.round(sticky.getBoundingClientRect().top + 1),
    );
    const plain = await render(tall());
    plain.scrollTop = 200;
    await wait(50);
    expect((rows(plain)[0] as Su3TableRow).getBoundingClientRect().bottom).toBeLessThan(
      plain.getBoundingClientRect().top,
    );
  });
});

describe('scrolling and the keyboard', () => {
  it('becomes a tab stop while it scrolls, and not when it does not', async () => {
    const tall = await render(
      `<su3-data-table aria-label="Long" style="--su3-comp-data-table-max-height: 120px; width: 300px">
        <su3-table-row header><su3-table-cell>Name</su3-table-cell></su3-table-row>
        ${Array.from({ length: 12 }, (_, index) => `<su3-table-row><su3-table-cell>Row ${String(index)}</su3-table-cell></su3-table-row>`).join('')}
      </su3-data-table>`,
    );
    await wait(60);
    expect(tall.getAttribute('tabindex')).toBe('0');
    tall.style.setProperty('--su3-comp-data-table-max-height', 'none');
    await wait(60);
    expect(tall.hasAttribute('tabindex')).toBe(false);
    const short = await render(basic());
    await wait(60);
    expect(short.hasAttribute('tabindex')).toBe(false);
  });

  it('leaves a tabindex the author set alone', async () => {
    const table = await render(basic('tabindex="-1"'));
    await wait(60);
    expect(table.getAttribute('tabindex')).toBe('-1');
  });
});

describe('content', () => {
  it('holds other components in a cell', async () => {
    await render(
      `<su3-data-table aria-label="Orders"><su3-table-row><su3-table-cell><su3-button>Open</su3-button></su3-table-cell></su3-table-row></su3-data-table>`,
    );
    await expect.element(page.getByRole('button', { name: 'Open' })).toBeVisible();
  });
});
