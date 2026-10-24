import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import './index.ts';
import type { Su3TableRow } from './table-row.ts';

async function render(markup: string): Promise<Su3TableRow> {
  document.body.innerHTML = markup;
  const row = document.querySelector('su3-table-row');
  if (!row) throw new Error('No su3-table-row was rendered');
  await row.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 30));
  return row;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-table-row', () => {
  it('is a row of cells', async () => {
    await render(
      '<su3-table-row><su3-table-cell>Ada</su3-table-cell><su3-table-cell>98</su3-table-cell></su3-table-row>',
    );
    await expect.element(page.getByRole('row')).toBeVisible();
    await expect.element(page.getByRole('cell', { name: 'Ada' })).toBeVisible();
  });

  it('makes its cells column headers when it is the header row, and back', async () => {
    const row = await render(
      '<su3-table-row header><su3-table-cell>Name</su3-table-cell><su3-table-cell>Score</su3-table-cell></su3-table-row>',
    );
    await expect.element(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    row.header = false;
    await row.updateComplete;
    await expect.element(page.getByRole('cell', { name: 'Name' })).toBeVisible();
  });

  it('gives a cell added later the header role', async () => {
    const row = await render(
      '<su3-table-row header><su3-table-cell>A</su3-table-cell></su3-table-row>',
    );
    const extra = document.createElement('su3-table-cell');
    extra.textContent = 'B';
    row.append(extra);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(extra.header).toBe(true);
  });

  it('lays the cells out equally without a table, side by side', async () => {
    const row = await render(
      '<su3-table-row style="width: 300px"><su3-table-cell>A</su3-table-cell><su3-table-cell>B</su3-table-cell><su3-table-cell>C</su3-table-cell></su3-table-row>',
    );
    const widths = row.cells().map((cell) => Math.round(cell.getBoundingClientRect().width));
    expect(new Set(widths).size).toBe(1);
    const lefts = row.cells().map((cell) => cell.getBoundingClientRect().left);
    expect(lefts[1]).toBeGreaterThan(lefts[0] ?? 0);
  });

  it('is tinted when selected and follows the selected hook, and draws a line below', async () => {
    const row = await render(
      '<su3-table-row selected style="--su3-comp-data-table-selected-color: rgb(1, 2, 3)"><su3-table-cell>A</su3-table-cell></su3-table-row>',
    );
    expect(getComputedStyle(row).backgroundColor).toBe('rgb(1, 2, 3)');
    expect(getComputedStyle(row).borderBlockEndWidth).toBe('1px');
  });

  it('has no aria-selected outside a selectable table', async () => {
    await render('<su3-table-row selected><su3-table-cell>A</su3-table-cell></su3-table-row>');
    await expect.element(page.getByRole('row')).not.toHaveAttribute('aria-selected');
  });
});
