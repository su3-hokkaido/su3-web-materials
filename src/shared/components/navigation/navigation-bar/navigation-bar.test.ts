import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './index.ts';
import type { Su3NavigationItem } from '../navigation-item/navigation-item.ts';
import type { Su3NavigationBar } from './navigation-bar.ts';

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

async function render(markup: string): Promise<Su3NavigationBar> {
  document.body.innerHTML = markup;
  const bar = document.querySelector('su3-navigation-bar');
  if (!bar) throw new Error('No su3-navigation-bar was rendered');
  await bar.updateComplete;
  await settle();
  await bar.updateComplete;
  return bar;
}

const items = (bar: Su3NavigationBar): Su3NavigationItem[] => [
  ...bar.querySelectorAll('su3-navigation-item'),
];

const basic = `<su3-navigation-bar aria-label="Primary">
  <su3-navigation-item value="home">Home</su3-navigation-item>
  <su3-navigation-item value="inbox" selected>Inbox</su3-navigation-item>
  <su3-navigation-item value="settings">Settings</su3-navigation-item>
</su3-navigation-bar>`;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-navigation-bar', () => {
  it('is a navigation landmark named by aria-label', async () => {
    await render(basic);
    await expect.element(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  });

  it('derives value from the selected item and marks it as the current page', async () => {
    const bar = await render(basic);
    expect(bar.value).toBe('inbox');
    await expect
      .element(page.getByRole('button', { name: 'Inbox' }))
      .toHaveAttribute('aria-current', 'page');
    await expect
      .element(page.getByRole('button', { name: 'Home' }))
      .not.toHaveAttribute('aria-current');
  });

  it('selects the item named by value, also when set later', async () => {
    const bar = await render(basic);
    bar.value = 'settings';
    await bar.updateComplete;
    expect(items(bar).map((item) => item.selected)).toEqual([false, false, true]);
  });

  it('a value set before the items exist wins over selected attributes', async () => {
    document.body.innerHTML = '<su3-navigation-bar></su3-navigation-bar>';
    const bar = document.querySelector('su3-navigation-bar');
    if (!bar) throw new Error('No bar');
    bar.value = 'home';
    bar.innerHTML = basic.replace(/<\/?su3-navigation-bar[^>]*>/g, '');
    await bar.updateComplete;
    await settle();
    expect(items(bar).map((item) => item.selected)).toEqual([true, false, false]);
  });

  it('selects on click and fires change once, without input', async () => {
    const bar = await render(basic);
    const events: string[] = [];
    bar.addEventListener('change', () => events.push('change'));
    bar.addEventListener('input', () => events.push('input'));
    await page.getByRole('button', { name: 'Home' }).click();
    expect(bar.value).toBe('home');
    expect(items(bar).map((item) => item.selected)).toEqual([true, false, false]);
    expect(events).toEqual(['change']);
  });

  it('does not fire change for the selected or a disabled item', async () => {
    const bar = await render(basic.replace('value="settings"', 'value="settings" disabled'));
    let count = 0;
    bar.addEventListener('change', () => (count += 1));
    await page.getByRole('button', { name: 'Inbox' }).click();
    items(bar)[2]?.click();
    expect(count).toBe(0);
    expect(bar.value).toBe('inbox');
  });

  it('keeps every item in the tab order and activates with Enter', async () => {
    const bar = await render(basic);
    await userEvent.tab();
    expect(document.activeElement).toBe(items(bar)[0]);
    await userEvent.tab();
    expect(document.activeElement).toBe(items(bar)[1]);
    await userEvent.keyboard('{Enter}');
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(bar.value).toBe('settings');
  });

  it('keeps a single selection when an item is selected directly', async () => {
    const bar = await render(basic);
    const home = items(bar)[0];
    if (!home) throw new Error('No item');
    home.selected = true;
    await home.updateComplete;
    await bar.updateComplete;
    expect(bar.value).toBe('home');
    expect(items(bar).map((item) => item.selected)).toEqual([true, false, false]);
  });

  it('follows added and removed items', async () => {
    const bar = await render(basic);
    const extra = document.createElement('su3-navigation-item');
    extra.value = 'extra';
    extra.selected = true;
    extra.textContent = 'Extra';
    bar.append(extra);
    await settle();
    await bar.updateComplete;
    expect(bar.value).toBe('extra');
    extra.remove();
    await settle();
    expect(bar.value).toBe('');
  });
});

describe('link items', () => {
  const links = `<su3-navigation-bar aria-label="Primary">
    <su3-navigation-item value="home" href="#home" selected>Home</su3-navigation-item>
    <su3-navigation-item value="inbox" href="#inbox">Inbox</su3-navigation-item>
    <su3-navigation-item value="settings" href="#settings" disabled>Settings</su3-navigation-item>
  </su3-navigation-bar>`;

  it('selects and fires change when a link is clicked, and ignores a disabled link', async () => {
    const bar = await render(links);
    let count = 0;
    bar.addEventListener('change', () => (count += 1));
    await page.getByRole('link', { name: 'Inbox' }).click();
    expect(bar.value).toBe('inbox');
    expect(count).toBe(1);
    items(bar)[2]?.click();
    expect(count).toBe(1);
    expect(bar.value).toBe('inbox');
  });

  it('does not leak the internal item signal outside the bar', async () => {
    const bar = await render(basic);
    let leaked = false;
    document.body.addEventListener('su3-navigation-item-change', () => (leaked = true));
    const home = items(bar)[0];
    if (!home) throw new Error('No item');
    home.disabled = true;
    await home.updateComplete;
    expect(leaked).toBe(false);
  });
});

describe('appearance (built-in light values)', () => {
  it('lays the items out in equal widths with the pill on the selected one', async () => {
    const bar = await render(basic);
    const widths = items(bar).map((item) => Math.round(item.getBoundingClientRect().width));
    expect(new Set(widths).size).toBe(1);
    const pill = (item: Su3NavigationItem): CSSStyleDeclaration => {
      const element = item.shadowRoot?.querySelector('[part="indicator"]');
      if (!element) throw new Error('No indicator');
      return getComputedStyle(element);
    };
    expect(pill(items(bar)[1] as Su3NavigationItem).backgroundColor).toBe('rgb(200, 244, 255)');
    expect(pill(items(bar)[0] as Su3NavigationItem).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('follows the indicator hook set on the bar', async () => {
    const bar = await render(
      basic.replace(
        '<su3-navigation-bar',
        '<su3-navigation-bar style="--su3-comp-navigation-bar-indicator-color: rgb(1, 2, 3)"',
      ),
    );
    const element = items(bar)[1]?.shadowRoot?.querySelector('[part="indicator"]');
    if (!element) throw new Error('No indicator');
    expect(getComputedStyle(element).backgroundColor).toBe('rgb(1, 2, 3)');
  });
});
