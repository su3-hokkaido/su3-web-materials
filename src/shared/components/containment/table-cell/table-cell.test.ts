import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import './index.ts';
import type { Su3TableCell } from './table-cell.ts';

async function render(markup: string): Promise<Su3TableCell> {
  document.body.innerHTML = markup;
  const cell = document.querySelector('su3-table-cell');
  if (!cell) throw new Error('No su3-table-cell was rendered');
  await cell.updateComplete;
  return cell;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-table-cell', () => {
  it('is a cell, or a column header when header is set', async () => {
    const cell = await render('<su3-table-cell>Engineer</su3-table-cell>');
    await expect.element(page.getByRole('cell', { name: 'Engineer' })).toBeVisible();
    cell.header = true;
    await cell.updateComplete;
    await expect.element(page.getByRole('columnheader', { name: 'Engineer' })).toBeVisible();
  });

  it('exposes aria-sort and a tab stop only for a sortable header', async () => {
    const cell = await render(
      '<su3-table-cell header sortable sort="ascending">Role</su3-table-cell>',
    );
    const header = page.getByRole('columnheader', { name: 'Role' });
    await expect.element(header).toHaveAttribute('aria-sort', 'ascending');
    await expect.element(header).toHaveAttribute('tabindex', '0');
    cell.sort = 'descending';
    await cell.updateComplete;
    await expect.element(header).toHaveAttribute('aria-sort', 'descending');
    cell.sortable = false;
    await cell.updateComplete;
    await expect.element(header).not.toHaveAttribute('aria-sort');
    await expect.element(header).not.toHaveAttribute('tabindex');
  });

  it('ignores sortable on a cell that is not a header', async () => {
    await render('<su3-table-cell sortable>Engineer</su3-table-cell>');
    const cell = page.getByRole('cell', { name: 'Engineer' });
    await expect.element(cell).not.toHaveAttribute('aria-sort');
    await expect.element(cell).not.toHaveAttribute('tabindex');
  });

  it('shows an arrow for the direction and none for an unsortable header', async () => {
    const cell = await render('<su3-table-cell header sortable>Role</su3-table-cell>');
    const arrow = (): Element | null => cell.shadowRoot?.querySelector('.sort') ?? null;
    expect(arrow()).not.toBeNull();
    const up = arrow()?.querySelector('path')?.getAttribute('d');
    cell.sort = 'descending';
    await cell.updateComplete;
    expect(arrow()?.querySelector('path')?.getAttribute('d')).not.toBe(up);
    cell.sortable = false;
    await cell.updateComplete;
    expect(arrow()).toBeNull();
  });

  it('aligns the content to the start, the center or the end of the cell', async () => {
    const cell = await render('<su3-table-cell style="width: 300px">Hi</su3-table-cell>');
    const content = cell.shadowRoot?.querySelector('[part="content"]');
    if (!content) throw new Error('No content');
    const box = cell.getBoundingClientRect();
    const left = (): number => content.getBoundingClientRect().left - box.left;
    const startLeft = left();
    cell.align = 'center';
    await cell.updateComplete;
    expect(left()).toBeGreaterThan(startLeft + 50);
    cell.align = 'end';
    await cell.updateComplete;
    expect(box.right - content.getBoundingClientRect().right).toBeLessThan(startLeft + 2);
  });

  it('keeps long content on one line with an ellipsis', async () => {
    const cell = await render(
      '<su3-table-cell style="width: 120px">A very long piece of text that does not fit</su3-table-cell>',
    );
    const content = cell.shadowRoot?.querySelector('[part="content"]');
    if (!content) throw new Error('No content');
    expect(getComputedStyle(content).textOverflow).toBe('ellipsis');
    expect(content.scrollWidth).toBeGreaterThan(content.clientWidth);
  });

  it('is at least the large control height and follows the text color hook', async () => {
    const cell = await render(
      '<su3-table-cell style="--su3-comp-data-table-text-color: rgb(1, 2, 3)">Hi</su3-table-cell>',
    );
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    expect(cell.getBoundingClientRect().height).toBeGreaterThanOrEqual(3 * rem - 1);
    expect(getComputedStyle(cell).color).toBe('rgb(1, 2, 3)');
  });
});
