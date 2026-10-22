import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../buttons/button/index.ts';
import './index.ts';
import type { Su3NavigationItem } from '../navigation-item/navigation-item.ts';
import type { NavigationDrawerCloseDetail, Su3NavigationDrawer } from './navigation-drawer.ts';

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

async function render(markup: string): Promise<Su3NavigationDrawer> {
  document.body.innerHTML = markup;
  const drawer = document.querySelector('su3-navigation-drawer');
  if (!drawer) throw new Error('No su3-navigation-drawer was rendered');
  await drawer.updateComplete;
  await settle();
  await drawer.updateComplete;
  return drawer;
}

const items = (drawer: Su3NavigationDrawer): Su3NavigationItem[] => [
  ...drawer.querySelectorAll('su3-navigation-item'),
];

const dialog = (drawer: Su3NavigationDrawer): HTMLDialogElement => {
  const element = drawer.shadowRoot?.querySelector('dialog');
  if (!element) throw new Error('No dialog');
  return element;
};

function isCloseDetail(value: unknown): value is NavigationDrawerCloseDetail {
  return typeof value === 'object' && value !== null && 'reason' in value;
}

function reasons(drawer: Su3NavigationDrawer): string[] {
  const seen: string[] = [];
  drawer.addEventListener('close', (event) => {
    if (event instanceof CustomEvent && isCloseDetail(event.detail)) seen.push(event.detail.reason);
  });
  return seen;
}

const content = `
  <h3>Library</h3>
  <su3-navigation-item value="home">Home</su3-navigation-item>
  <su3-navigation-item value="inbox" selected>Inbox</su3-navigation-item>
  <su3-navigation-item value="settings">Settings</su3-navigation-item>`;

const standard = `<su3-navigation-drawer aria-label="Primary">${content}</su3-navigation-drawer>`;
const modal = `<button id="opener">Open</button>
  <su3-navigation-drawer aria-label="Primary" modal>${content}</su3-navigation-drawer>`;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-navigation-drawer (standard)', () => {
  it('is a navigation landmark that is always visible', async () => {
    await render(standard);
    await expect.element(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible();
  });

  it('derives value from the selected item and marks it as the current page', async () => {
    const drawer = await render(standard);
    expect(drawer.value).toBe('inbox');
    await expect
      .element(page.getByRole('button', { name: 'Inbox' }))
      .toHaveAttribute('aria-current', 'page');
  });

  it('selects on click and fires change once, and ignores the heading', async () => {
    const drawer = await render(standard);
    let count = 0;
    drawer.addEventListener('change', () => (count += 1));
    await page.getByText('Library').click();
    expect(count).toBe(0);
    await page.getByRole('button', { name: 'Home' }).click();
    expect(drawer.value).toBe('home');
    expect(count).toBe(1);
  });

  it('puts the items in the inline layout, the label beside the icon', async () => {
    const drawer = await render(standard);
    expect(items(drawer).map((item) => item.layout)).toEqual(['inline', 'inline', 'inline']);
  });

  it('styles slotted headings and takes the default width', async () => {
    const drawer = await render(standard);
    const heading = drawer.querySelector('h3');
    if (!heading) throw new Error('No heading');
    // An unstyled h3 would be larger than the label-sized heading.
    expect(parseFloat(getComputedStyle(heading).fontSize)).toBeLessThan(
      parseFloat(getComputedStyle(document.body).fontSize),
    );
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    expect(Math.round(drawer.getBoundingClientRect().width)).toBe(Math.round(18 * rem));
  });

  it('ignores open and renders no dialog', async () => {
    const drawer = await render(
      standard.replace('<su3-navigation-drawer', '<su3-navigation-drawer open'),
    );
    expect(drawer.shadowRoot?.querySelector('dialog')).toBeNull();
  });

  it('follows the width and indicator hooks', async () => {
    const drawer = await render(
      standard.replace(
        '<su3-navigation-drawer',
        '<su3-navigation-drawer style="--su3-comp-navigation-drawer-width: 200px; --su3-comp-navigation-bar-indicator-color: rgb(1, 2, 3)"',
      ),
    );
    expect(Math.round(drawer.getBoundingClientRect().width)).toBe(200);
    const control = items(drawer)[1]?.shadowRoot?.querySelector('[part="control"]');
    if (!control) throw new Error('No control');
    expect(getComputedStyle(control).backgroundColor).toBe('rgb(1, 2, 3)');
  });
});

describe('su3-navigation-drawer (selection)', () => {
  it('selects the item named by value, also when set later', async () => {
    const drawer = await render(standard);
    drawer.value = 'settings';
    await drawer.updateComplete;
    expect(items(drawer).map((item) => item.selected)).toEqual([false, false, true]);
  });

  it('does not select or fire change for a disabled item', async () => {
    const drawer = await render(standard.replace('value="settings"', 'value="settings" disabled'));
    let count = 0;
    drawer.addEventListener('change', () => (count += 1));
    items(drawer)[2]?.click();
    expect(count).toBe(0);
    expect(drawer.value).toBe('inbox');
  });

  it('keeps the items in the tab order and activates with Enter and Space', async () => {
    const drawer = await render(standard);
    await userEvent.tab();
    expect(document.activeElement).toBe(items(drawer)[0]);
    await userEvent.keyboard('{Enter}');
    expect(drawer.value).toBe('home');
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(drawer.value).toBe('settings');
  });

  it('shows the header only while something is slotted', async () => {
    const drawer = await render(standard);
    const header = drawer.shadowRoot?.querySelector('[part="header"]');
    if (!header) throw new Error('No header');
    expect(getComputedStyle(header).display).toBe('none');
    const title = document.createElement('strong');
    title.slot = 'header';
    title.textContent = 'Mail';
    drawer.append(title);
    await settle();
    await drawer.updateComplete;
    expect(getComputedStyle(header).display).not.toBe('none');
  });
});

describe('su3-navigation-drawer (modal)', () => {
  it('keeps value and the inline layout when modal is switched at runtime', async () => {
    const drawer = await render(standard);
    drawer.modal = true;
    await drawer.updateComplete;
    await settle();
    expect(drawer.shadowRoot?.querySelector('dialog')).not.toBeNull();
    expect(drawer.value).toBe('inbox');
    expect(items(drawer).map((item) => item.layout)).toEqual(['inline', 'inline', 'inline']);
    drawer.modal = false;
    await drawer.updateComplete;
    await settle();
    expect(drawer.shadowRoot?.querySelector('dialog')).toBeNull();
    expect(drawer.value).toBe('inbox');
  });

  it('names the dialog and not the landmark inside it', async () => {
    await render(modal.replace('modal>', 'modal open>'));
    await expect.element(page.getByRole('dialog', { name: 'Primary' })).toBeVisible();
    expect(page.getByRole('navigation', { name: 'Primary' }).elements()).toHaveLength(0);
  });

  it('keeps Tab inside the open dialog', async () => {
    const drawer = await render(modal.replace('modal>', 'modal open>'));
    for (let i = 0; i < 6; i += 1) await userEvent.tab();
    expect(drawer.contains(document.activeElement)).toBe(true);
  });

  it('is hidden until open and then shown as a modal dialog', async () => {
    const drawer = await render(modal);
    expect(dialog(drawer).open).toBe(false);
    drawer.open = true;
    await drawer.updateComplete;
    expect(dialog(drawer).open).toBe(true);
    expect(dialog(drawer).matches(':modal')).toBe(true);
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible();
  });

  it('moves focus to the selected item on open and back to the opener on close', async () => {
    const drawer = await render(modal);
    const opener = document.getElementById('opener');
    opener?.focus();
    drawer.open = true;
    await drawer.updateComplete;
    expect(document.activeElement).toBe(items(drawer)[1]);
    drawer.open = false;
    await drawer.updateComplete;
    await settle();
    expect(document.activeElement).toBe(opener);
  });

  it('focuses the selected item when it is open from the first render', async () => {
    const drawer = await render(modal.replace('modal>', 'modal open>'));
    await settle();
    expect(document.activeElement).toBe(items(drawer)[1]);
  });

  it('closes on Escape and reports it', async () => {
    const drawer = await render(modal.replace('modal>', 'modal open>'));
    const seen = reasons(drawer);
    await userEvent.keyboard('{Escape}');
    await drawer.updateComplete;
    expect(drawer.open).toBe(false);
    expect(dialog(drawer).open).toBe(false);
    expect(seen).toEqual(['escape']);
  });

  it('closes on a click on the scrim, not on the content', async () => {
    const drawer = await render(modal.replace('modal>', 'modal open>'));
    const seen = reasons(drawer);
    await page.getByRole('button', { name: 'Home' }).click();
    expect(drawer.open).toBe(true);
    const box = dialog(drawer).getBoundingClientRect();
    await userEvent.click(document.body, {
      position: { x: Math.round(box.right + 40), y: 40 },
    });
    await drawer.updateComplete;
    expect(drawer.open).toBe(false);
    expect(seen).toEqual(['scrim']);
  });

  it('stays open after a selection unless close-on-select is set', async () => {
    const drawer = await render(modal.replace('modal>', 'modal open>'));
    await page.getByRole('button', { name: 'Home' }).click();
    expect(drawer.value).toBe('home');
    expect(drawer.open).toBe(true);
  });

  it('closes after a selection with close-on-select, and the change comes first', async () => {
    const drawer = await render(modal.replace('modal>', 'modal open close-on-select>'));
    const order: string[] = [];
    drawer.addEventListener('change', () => order.push('change'));
    drawer.addEventListener('close', () => order.push('close'));
    await page.getByRole('button', { name: 'Home' }).click();
    await drawer.updateComplete;
    expect(drawer.open).toBe(false);
    expect(order).toEqual(['change', 'close']);
  });

  it('fires no event when closed from outside', async () => {
    const drawer = await render(modal.replace('modal>', 'modal open>'));
    const seen = reasons(drawer);
    drawer.open = false;
    await drawer.updateComplete;
    expect(seen).toEqual([]);
    expect(dialog(drawer).open).toBe(false);
  });

  it('pins the panel to the inline-start edge with the default width', async () => {
    const drawer = await render(modal.replace('modal>', 'modal open>'));
    await settle();
    await Promise.all(
      dialog(drawer)
        .getAnimations()
        .map((animation) => animation.finished),
    );
    const box = dialog(drawer).getBoundingClientRect();
    expect(Math.round(box.left)).toBe(0);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    expect(Math.round(box.width)).toBe(Math.round(18 * rem));
    expect(Math.round(box.height)).toBe(window.innerHeight);
  });
});
