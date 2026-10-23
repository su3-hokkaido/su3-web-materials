import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import './index.ts';
import type { Su3MenuItem } from './menu-item.ts';

async function render(markup: string): Promise<Su3MenuItem> {
  document.body.innerHTML = markup;
  const item = document.querySelector('su3-menu-item');
  if (!item) throw new Error('No su3-menu-item was rendered');
  await item.updateComplete;
  return item;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-menu-item', () => {
  it('has the menuitem role and is named by its label', async () => {
    await render('<su3-menu-item>Duplicate</su3-menu-item>');
    await expect.element(page.getByRole('menuitem', { name: 'Duplicate' })).toBeVisible();
  });

  it('is a checkbox that reflects checked when checkable', async () => {
    const item = await render('<su3-menu-item checkable>Show grid</su3-menu-item>');
    const role = page.getByRole('menuitemcheckbox', { name: 'Show grid' });
    await expect.element(role).toHaveAttribute('aria-checked', 'false');
    item.checked = true;
    await item.updateComplete;
    await expect.element(role).toHaveAttribute('aria-checked', 'true');
    const check = item.shadowRoot?.querySelector('.check');
    if (!check) throw new Error('No check mark');
    expect(getComputedStyle(check).visibility).toBe('visible');
  });

  it('keeps the check mark space but hides it while unchecked', async () => {
    const item = await render('<su3-menu-item checkable>Show grid</su3-menu-item>');
    const check = item.shadowRoot?.querySelector('.check');
    if (!check) throw new Error('No check mark');
    expect(getComputedStyle(check).visibility).toBe('hidden');
    expect(check.getBoundingClientRect().width).toBeGreaterThan(0);
  });

  it('is exposed as disabled', async () => {
    await render('<su3-menu-item disabled>Delete</su3-menu-item>');
    await expect
      .element(page.getByRole('menuitem', { name: 'Delete' }))
      .toHaveAttribute('aria-disabled', 'true');
  });

  it('shows the leading and trailing slots around the label', async () => {
    const item = await render(
      '<su3-menu-item><svg slot="leading" width="20" height="20" aria-hidden="true"></svg>Copy<span slot="trailing">Ctrl+C</span></su3-menu-item>',
    );
    const icon = item.querySelector('svg')?.getBoundingClientRect();
    const label = item.shadowRoot?.querySelector('[part="label"]')?.getBoundingClientRect();
    const shortcut = item.querySelector('span')?.getBoundingClientRect();
    if (!icon || !label || !shortcut) throw new Error('No boxes');
    expect(icon.right).toBeLessThanOrEqual(label.left);
    expect(label.right).toBeLessThanOrEqual(shortcut.left + 1);
  });

  it('is at least the large control height and follows the label color hook', async () => {
    const item = await render(
      '<su3-menu-item style="--su3-comp-menu-label-color: rgb(1, 2, 3)">Copy</su3-menu-item>',
    );
    const row = item.shadowRoot?.querySelector('[part="item"]');
    if (!row) throw new Error('No row');
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(3 * rem - 1);
    expect(getComputedStyle(row).color).toBe('rgb(1, 2, 3)');
  });
});
