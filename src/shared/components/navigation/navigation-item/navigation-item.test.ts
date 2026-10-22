import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import '../../feedback/badge/index.ts';
import './index.ts';
import type { Su3NavigationItem } from './navigation-item.ts';

async function render(markup: string): Promise<Su3NavigationItem> {
  document.body.innerHTML = markup;
  const item = document.querySelector('su3-navigation-item');
  if (!item) throw new Error('No su3-navigation-item was rendered');
  await item.updateComplete;
  return item;
}

const icon =
  '<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z" /></svg>';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-navigation-item', () => {
  it('renders a button named by its label', async () => {
    await render(`<su3-navigation-item value="a">${icon}Home</su3-navigation-item>`);
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible();
  });

  it('renders a link when href is set', async () => {
    await render('<su3-navigation-item href="#home">Home</su3-navigation-item>');
    await expect.element(page.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '#home');
  });

  it('marks the selected item as the current page', async () => {
    const item = await render('<su3-navigation-item>Home</su3-navigation-item>');
    await expect.element(page.getByRole('button')).not.toHaveAttribute('aria-current');
    item.selected = true;
    await item.updateComplete;
    expect(item.hasAttribute('selected')).toBe(true);
    await expect.element(page.getByRole('button')).toHaveAttribute('aria-current', 'page');
  });

  it('is unavailable when disabled, as a button and as a link', async () => {
    const item = await render('<su3-navigation-item disabled>Home</su3-navigation-item>');
    await expect.element(page.getByRole('button')).toBeDisabled();
    item.href = '#home';
    await item.updateComplete;
    const link = page.getByRole('link');
    await expect.element(link).toHaveAttribute('aria-disabled', 'true');
    await expect.element(link).not.toHaveAttribute('href');
  });

  it('announces selected and disabled changes to the bar', async () => {
    const item = await render('<su3-navigation-item>Home</su3-navigation-item>');
    let count = 0;
    item.addEventListener('su3-navigation-item-change', () => (count += 1));
    item.selected = true;
    await item.updateComplete;
    item.disabled = true;
    await item.updateComplete;
    expect(count).toBe(2);
  });

  it('shows the pill only when selected', async () => {
    const item = await render(`<su3-navigation-item>${icon}Home</su3-navigation-item>`);
    const pill = item.shadowRoot?.querySelector('[part="indicator"]');
    if (!pill) throw new Error('No indicator');
    expect(getComputedStyle(pill).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    item.selected = true;
    await item.updateComplete;
    // The color is animated, so wait for the transition to end.
    await Promise.all(pill.getAnimations().map((animation) => animation.finished));
    expect(getComputedStyle(pill).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(pill).borderTopLeftRadius).toBe('9999px');
  });

  it('shows a badge in its slot', async () => {
    await render(
      `<su3-navigation-item>${icon}<su3-badge slot="badge" count="3"></su3-badge>Inbox</su3-navigation-item>`,
    );
    expect(document.querySelector('su3-badge')?.assignedSlot?.name).toBe('badge');
  });
});
