import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../buttons/icon-button/index.ts';
import './index.ts';
import type { Su3NavigationItem } from '../navigation-item/navigation-item.ts';
import type { Su3NavigationRail } from './navigation-rail.ts';

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

async function render(markup: string): Promise<Su3NavigationRail> {
  document.body.innerHTML = markup;
  const rail = document.querySelector('su3-navigation-rail');
  if (!rail) throw new Error('No su3-navigation-rail was rendered');
  await rail.updateComplete;
  await settle();
  await rail.updateComplete;
  return rail;
}

const items = (rail: Su3NavigationRail): Su3NavigationItem[] => [
  ...rail.querySelectorAll('su3-navigation-item'),
];

const basic = `<su3-navigation-rail aria-label="Primary">
  <su3-navigation-item value="home">Home</su3-navigation-item>
  <su3-navigation-item value="inbox" selected>Inbox</su3-navigation-item>
  <su3-navigation-item value="settings">Settings</su3-navigation-item>
</su3-navigation-rail>`;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-navigation-rail', () => {
  it('is a navigation landmark named by aria-label', async () => {
    await render(basic);
    await expect.element(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  });

  it('derives value from the selected item and marks it as the current page', async () => {
    const rail = await render(basic);
    expect(rail.value).toBe('inbox');
    await expect
      .element(page.getByRole('button', { name: 'Inbox' }))
      .toHaveAttribute('aria-current', 'page');
    await expect
      .element(page.getByRole('button', { name: 'Home' }))
      .not.toHaveAttribute('aria-current');
  });

  it('selects the item named by value, also when set later', async () => {
    const rail = await render(basic);
    rail.value = 'settings';
    await rail.updateComplete;
    expect(items(rail).map((item) => item.selected)).toEqual([false, false, true]);
  });

  it('clears the selection for a value that matches no item', async () => {
    const rail = await render(basic);
    rail.value = 'nowhere';
    await rail.updateComplete;
    expect(items(rail).map((item) => item.selected)).toEqual([false, false, false]);
    expect(rail.value).toBe('');
  });

  it('selects on click and fires change once, without input', async () => {
    const rail = await render(basic);
    const events: string[] = [];
    rail.addEventListener('change', () => events.push('change'));
    rail.addEventListener('input', () => events.push('input'));
    await page.getByRole('button', { name: 'Home' }).click();
    expect(rail.value).toBe('home');
    expect(items(rail).map((item) => item.selected)).toEqual([true, false, false]);
    expect(events).toEqual(['change']);
  });

  it('does not fire change for the selected or a disabled item', async () => {
    const rail = await render(basic.replace('value="settings"', 'value="settings" disabled'));
    let count = 0;
    rail.addEventListener('change', () => (count += 1));
    await page.getByRole('button', { name: 'Inbox' }).click();
    items(rail)[2]?.click();
    expect(count).toBe(0);
    expect(rail.value).toBe('inbox');
  });

  it('keeps every item in the tab order and activates with Enter', async () => {
    const rail = await render(basic);
    await userEvent.tab();
    expect(document.activeElement).toBe(items(rail)[0]);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(rail.value).toBe('inbox');
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(rail.value).toBe('settings');
  });

  it('does not leak the internal item signal outside the rail', async () => {
    const rail = await render(basic);
    let leaked = false;
    document.body.addEventListener('su3-navigation-item-change', () => (leaked = true));
    const home = items(rail)[0];
    if (!home) throw new Error('No item');
    home.disabled = true;
    await home.updateComplete;
    expect(leaked).toBe(false);
  });
});

describe('header slot', () => {
  const withHeader = `<su3-navigation-rail aria-label="Primary">
    <su3-icon-button slot="header" aria-label="Menu">M</su3-icon-button>
    <su3-navigation-item value="home" selected>Home</su3-navigation-item>
  </su3-navigation-rail>`;

  it('shows the header above the items and keeps it out of the selection', async () => {
    const rail = await render(withHeader);
    const menu = page.getByRole('button', { name: 'Menu' });
    await expect.element(menu).toBeVisible();
    const menuBox = rail.querySelector('su3-icon-button')?.getBoundingClientRect();
    const itemBox = items(rail)[0]?.getBoundingClientRect();
    if (!menuBox || !itemBox) throw new Error('No boxes');
    expect(menuBox.bottom).toBeLessThanOrEqual(itemBox.top);
    expect(rail.value).toBe('home');
    await menu.click();
    expect(rail.value).toBe('home');
  });

  it('takes no space without a header', async () => {
    const rail = await render(basic);
    const header = rail.shadowRoot?.querySelector('[part="header"]');
    if (!header) throw new Error('No header');
    expect(getComputedStyle(header).display).toBe('none');
  });
});

describe('appearance (built-in light values)', () => {
  it('stacks the items vertically at equal height inside the rail width', async () => {
    const rail = await render(basic);
    const boxes = items(rail).map((item) => item.getBoundingClientRect());
    const [first, second] = boxes;
    if (!first || !second) throw new Error('No boxes');
    expect(second.top).toBeGreaterThan(first.bottom - 1);
    expect(new Set(boxes.map((box) => Math.round(box.height))).size).toBe(1);
    expect(Math.round(rail.getBoundingClientRect().width)).toBe(80);
  });

  it('follows the width hook and the indicator hook set on the rail', async () => {
    const rail = await render(
      basic.replace(
        '<su3-navigation-rail',
        '<su3-navigation-rail style="--su3-comp-navigation-rail-width: 120px; --su3-comp-navigation-bar-indicator-color: rgb(1, 2, 3)"',
      ),
    );
    expect(Math.round(rail.getBoundingClientRect().width)).toBe(120);
    const pill = items(rail)[1]?.shadowRoot?.querySelector('[part="indicator"]');
    if (!pill) throw new Error('No indicator');
    expect(getComputedStyle(pill).backgroundColor).toBe('rgb(1, 2, 3)');
  });
});
