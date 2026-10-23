import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../buttons/button/index.ts';
import '../../containment/divider/index.ts';
import './index.ts';
import type { Su3MenuItem } from '../menu-item/menu-item.ts';
import type { MenuCloseDetail, MenuSelectDetail, Su3Menu } from './menu.ts';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function render(markup: string): Promise<Su3Menu> {
  document.body.innerHTML = markup;
  const menu = document.querySelector('su3-menu');
  if (!menu) throw new Error('No su3-menu was rendered');
  await menu.updateComplete;
  await wait(30);
  return menu;
}

const surface = (menu: Su3Menu): HTMLElement => {
  const element = menu.shadowRoot?.querySelector<HTMLElement>('[part="surface"]');
  if (!element) throw new Error('No surface');
  return element;
};

const items = (menu: Su3Menu): Su3MenuItem[] => [...menu.querySelectorAll('su3-menu-item')];

function isSelect(value: unknown): value is MenuSelectDetail {
  return typeof value === 'object' && value !== null && 'item' in value;
}
function isClose(value: unknown): value is MenuCloseDetail {
  return typeof value === 'object' && value !== null && 'reason' in value;
}

/** Records the `select` values and `close` reasons, in order. */
function record(menu: Su3Menu): string[] {
  const seen: string[] = [];
  menu.addEventListener('select', (event) => {
    if (event instanceof CustomEvent && isSelect(event.detail)) {
      seen.push(`select:${event.detail.value}`);
    }
  });
  menu.addEventListener('close', (event) => {
    if (event instanceof CustomEvent && isClose(event.detail)) {
      seen.push(`close:${event.detail.reason}`);
    }
  });
  return seen;
}

const basic = (attributes = ''): string => `<su3-menu ${attributes} style="margin: 100px 150px">
  <button slot="trigger">Actions</button>
  <su3-menu-item value="edit">Edit</su3-menu-item>
  <su3-menu-item value="copy">Duplicate</su3-menu-item>
  <su3-divider></su3-divider>
  <su3-menu-item value="delete" disabled>Delete</su3-menu-item>
  <su3-menu-item value="archive">Archive</su3-menu-item>
</su3-menu>
<p>after</p>`;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-menu', () => {
  it('is hidden until the trigger is clicked, then shows the menu in the top layer', async () => {
    const menu = await render(basic());
    await expect.element(page.getByText('Edit')).not.toBeVisible();
    await page.getByRole('button', { name: 'Actions' }).click();
    expect(menu.open).toBe(true);
    expect(surface(menu).matches(':popover-open')).toBe(true);
    await expect.element(page.getByRole('menu')).toBeVisible();
    await expect.element(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
  });

  it('describes the trigger with aria-haspopup and aria-expanded', async () => {
    const menu = await render(basic());
    const trigger = page.getByRole('button', { name: 'Actions' });
    await expect.element(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
    menu.open = true;
    await menu.updateComplete;
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('describes a su3-button trigger through the forwarded attributes', async () => {
    await render(
      '<su3-menu><su3-button slot="trigger">Actions</su3-button><su3-menu-item>Edit</su3-menu-item></su3-menu>',
    );
    const trigger = page.getByRole('button', { name: 'Actions' });
    await expect.element(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves focus to the first available item when opened and toggles on a second click', async () => {
    const menu = await render(basic());
    const seen = record(menu);
    await page.getByRole('button', { name: 'Actions' }).click();
    expect(document.activeElement).toBe(items(menu)[0]);
    await page.getByRole('button', { name: 'Actions' }).click();
    expect(menu.open).toBe(false);
    expect(seen).toEqual(['close:trigger']);
  });

  it('selects an item with a click, reports it, closes and returns focus to the trigger', async () => {
    const menu = await render(basic());
    const seen = record(menu);
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    expect(menu.open).toBe(false);
    expect(seen).toEqual(['select:copy', 'close:select']);
    expect(document.activeElement).toBe(document.querySelector('button'));
  });

  it('ignores a disabled item', async () => {
    const menu = await render(basic('open'));
    const seen = record(menu);
    items(menu)[2]?.click();
    expect(menu.open).toBe(true);
    expect(seen).toEqual([]);
  });

  it('toggles a checkable item when it is selected', async () => {
    const menu = await render(
      '<su3-menu open><button slot="trigger">View</button><su3-menu-item checkable value="grid">Grid</su3-menu-item></su3-menu>',
    );
    const item = items(menu)[0];
    if (!item) throw new Error('No item');
    await page.getByRole('menuitemcheckbox', { name: 'Grid' }).click();
    expect(item.checked).toBe(true);
    menu.open = true;
    await menu.updateComplete;
    await page.getByRole('menuitemcheckbox', { name: 'Grid' }).click();
    expect(item.checked).toBe(false);
  });

  it('fires no event when closed from outside the element', async () => {
    const menu = await render(basic('open'));
    const seen = record(menu);
    menu.open = false;
    await menu.updateComplete;
    expect(seen).toEqual([]);
    expect(surface(menu).matches(':popover-open')).toBe(false);
  });

  it('closes on a press outside without moving focus back', async () => {
    const menu = await render(basic());
    const seen = record(menu);
    await page.getByRole('button', { name: 'Actions' }).click();
    await userEvent.click(document.body, { position: { x: 380, y: 20 } });
    expect(menu.open).toBe(false);
    expect(seen).toEqual(['close:outside']);
    expect(document.activeElement).not.toBe(document.querySelector('button'));
  });
});

describe('keyboard', () => {
  it('opens with ArrowDown on the trigger on the first item and with ArrowUp on the last', async () => {
    const menu = await render(basic());
    document.querySelector('button')?.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(menu.open).toBe(true);
    expect(document.activeElement).toBe(items(menu)[0]);
    await userEvent.keyboard('{Escape}');
    document.querySelector('button')?.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(items(menu)[3]);
  });

  it('opens with Enter on a native trigger', async () => {
    const menu = await render(basic());
    document.querySelector('button')?.focus();
    await userEvent.keyboard('{Enter}');
    expect(menu.open).toBe(true);
  });

  it('moves with the arrow keys, wraps around and skips disabled items', async () => {
    const menu = await render(basic('open'));
    await wait(30);
    const [edit, copy, , archive] = items(menu);
    expect(document.activeElement).toBe(edit);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(copy);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(archive);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(edit);
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(archive);
  });

  it('jumps with Home and End', async () => {
    const menu = await render(basic('open'));
    await wait(30);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(items(menu)[3]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(items(menu)[0]);
  });

  it('activates the focused item with Enter and with Space', async () => {
    const menu = await render(basic('open'));
    await wait(30);
    const seen = record(menu);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(seen).toEqual(['select:copy', 'close:select']);
    menu.open = true;
    await menu.updateComplete;
    await wait(30);
    await userEvent.keyboard(' ');
    expect(seen.slice(2)).toEqual(['select:edit', 'close:select']);
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const menu = await render(basic('open'));
    await wait(30);
    const seen = record(menu);
    await userEvent.keyboard('{Escape}');
    expect(menu.open).toBe(false);
    expect(seen).toEqual(['close:escape']);
    expect(document.activeElement).toBe(document.querySelector('button'));
  });

  it('closes on Tab and lets focus move on from the trigger', async () => {
    const menu = await render(basic('open'));
    await wait(30);
    const seen = record(menu);
    await userEvent.tab();
    expect(menu.open).toBe(false);
    expect(seen).toEqual(['close:tab']);
    expect(menu.contains(document.activeElement)).toBe(false);
  });

  it('closes on Escape when every item is disabled and focus stays on the trigger', async () => {
    const menu = await render(
      '<su3-menu><button slot="trigger">Go</button><su3-menu-item disabled>A</su3-menu-item></su3-menu>',
    );
    document.querySelector('button')?.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(menu.open).toBe(true);
    expect(document.activeElement).toBe(document.querySelector('button'));
    await userEvent.keyboard('{Escape}');
    expect(menu.open).toBe(false);
  });

  it('moves to the next item whose label starts with the typed letters', async () => {
    const menu = await render(basic('open'));
    await wait(30);
    await userEvent.keyboard('a');
    expect(document.activeElement).toBe(items(menu)[3]);
    await userEvent.keyboard('d');
    // "ad" matches nothing: the focus stays.
    expect(document.activeElement).toBe(items(menu)[3]);
    await wait(1100);
    await userEvent.keyboard('d');
    expect(document.activeElement).toBe(items(menu)[1]);
  });

  it('cycles through items that start with the same letter', async () => {
    const menu = await render(
      '<su3-menu open><button slot="trigger">Go</button><su3-menu-item>Beta</su3-menu-item><su3-menu-item>Bravo</su3-menu-item><su3-menu-item>Cat</su3-menu-item></su3-menu>',
    );
    await wait(30);
    await userEvent.keyboard('b');
    expect(document.activeElement).toBe(items(menu)[1]);
    await userEvent.keyboard('b');
    expect(document.activeElement).toBe(items(menu)[0]);
  });
});

describe('connection', () => {
  it('closes when it is removed from the document and can open again after it is added back', async () => {
    const menu = await render(basic('open'));
    const parent = menu.parentElement;
    menu.remove();
    expect(menu.open).toBe(false);
    parent?.prepend(menu);
    await menu.updateComplete;
    await page.getByRole('button', { name: 'Actions' }).click();
    expect(menu.open).toBe(true);
    expect(surface(menu).matches(':popover-open')).toBe(true);
  });
});

describe('placement', () => {
  const place = async (
    attributes: string,
    style = 'margin: 100px 150px',
  ): Promise<{
    anchor: DOMRect;
    tip: DOMRect;
  }> => {
    const menu = await render(
      `<su3-menu open ${attributes} style="${style}"><button slot="trigger">Actions</button><su3-menu-item>Edit</su3-menu-item><su3-menu-item>Duplicate</su3-menu-item></su3-menu>`,
    );
    await Promise.all(
      surface(menu)
        .getAnimations()
        .map((animation) => animation.finished),
    );
    const anchor = menu.querySelector('button')?.getBoundingClientRect();
    if (!anchor) throw new Error('No trigger');
    return { anchor, tip: surface(menu).getBoundingClientRect() };
  };

  it('opens below the trigger at its start edge by default', async () => {
    const { anchor, tip } = await place('');
    expect(tip.top).toBeGreaterThanOrEqual(anchor.bottom);
    expect(Math.abs(tip.left - anchor.left)).toBeLessThan(2);
  });

  it('aligns to the end edge with bottom-end', async () => {
    const { anchor, tip } = await place('placement="bottom-end"', 'margin: 100px 200px');
    expect(Math.abs(tip.right - anchor.right)).toBeLessThan(2);
  });

  it('opens above the trigger with top-start', async () => {
    const { anchor, tip } = await place('placement="top-start"', 'margin: 200px 150px');
    expect(tip.bottom).toBeLessThanOrEqual(anchor.top);
  });

  it('flips above when there is no room below', async () => {
    const { anchor, tip } = await place('', `margin: ${String(window.innerHeight - 60)}px 150px`);
    expect(tip.bottom).toBeLessThanOrEqual(anchor.top);
  });

  it('stays inside the viewport at the right edge', async () => {
    const { tip } = await place('', 'margin: 100px 0 0 calc(100vw - 40px)');
    expect(tip.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
    expect(tip.left).toBeGreaterThanOrEqual(0);
  });

  it('follows the trigger when it changes size after the menu opened', async () => {
    const menu = await render(
      '<su3-menu open placement="bottom-end" style="margin: 100px 250px"><button slot="trigger">A</button><su3-menu-item>Edit</su3-menu-item></su3-menu>',
    );
    const button = menu.querySelector('button');
    if (!button) throw new Error('No trigger');
    button.style.width = '150px';
    await wait(100);
    expect(
      Math.abs(surface(menu).getBoundingClientRect().right - button.getBoundingClientRect().right),
    ).toBeLessThan(2);
  });
});

describe('appearance (built-in light values)', () => {
  it('follows the container hook and is at least the minimum width', async () => {
    const menu = await render(
      '<su3-menu open style="margin: 100px 150px; --su3-comp-menu-container-color: rgb(1, 2, 3)"><button slot="trigger">Go</button><su3-menu-item>E</su3-menu-item></su3-menu>',
    );
    expect(getComputedStyle(surface(menu)).backgroundColor).toBe('rgb(1, 2, 3)');
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    expect(surface(menu).getBoundingClientRect().width).toBeGreaterThanOrEqual(12 * rem - 1);
  });
});
