import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './index.ts';
import type { Su3IconButton } from './icon-button.ts';

const ICON = '<svg width="20" height="20" aria-hidden="true"></svg>';

async function render(markup: string): Promise<Su3IconButton> {
  document.body.innerHTML = markup;
  const buttons = [...document.querySelectorAll('su3-icon-button')];
  await Promise.all(buttons.map((button) => button.updateComplete));
  const first = buttons[0];
  if (!first) throw new Error('No su3-icon-button was rendered');
  return first;
}

const control = (host: Su3IconButton): HTMLElement => {
  const element = host.shadowRoot?.querySelector<HTMLElement>('[part="button"]');
  if (!element) throw new Error('The button part was not rendered');
  return element;
};

const style = (host: Su3IconButton) => getComputedStyle(control(host));
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('rendering and accessibility', () => {
  it('forwards aria-haspopup and aria-expanded to the inner button', async () => {
    const host = await render(
      `<su3-icon-button aria-label="More" aria-haspopup="menu" aria-expanded="true">${ICON}</su3-icon-button>`,
    );
    const button = page.getByRole('button', { name: 'More' });
    await expect.element(button).toHaveAttribute('aria-haspopup', 'menu');
    await expect.element(button).toHaveAttribute('aria-expanded', 'true');
    host.setAttribute('aria-expanded', 'false');
    await host.updateComplete;
    await expect.element(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('exposes a button named by aria-label and starts as a standard medium button', async () => {
    const host = await render(`<su3-icon-button aria-label="Favorite">${ICON}</su3-icon-button>`);
    await expect.element(page.getByRole('button', { name: 'Favorite' })).toBeVisible();
    expect(host.variant).toBe('standard');
    expect(host.size).toBe('md');
    expect(host.type).toBe('button');
    expect(host.toggle).toBe(false);
  });

  it('reflects variant, size, toggle and selected', async () => {
    const host = await render(`<su3-icon-button aria-label="x">${ICON}</su3-icon-button>`);
    host.variant = 'tonal';
    host.size = 'lg';
    host.toggle = true;
    host.selected = true;
    await host.updateComplete;
    expect(host.getAttribute('variant')).toBe('tonal');
    expect(host.getAttribute('size')).toBe('lg');
    expect(host.hasAttribute('toggle')).toBe(true);
    expect(host.hasAttribute('selected')).toBe(true);
  });

  it('has no aria-pressed unless it is a toggle', async () => {
    await render(`<su3-icon-button aria-label="Favorite">${ICON}</su3-icon-button>`);
    await expect.element(page.getByRole('button')).not.toHaveAttribute('aria-pressed');
  });
});

describe('sizes and variants (built-in light values)', () => {
  for (const [size, pixels] of [
    ['sm', '32px'],
    ['md', '40px'],
    ['lg', '48px'],
  ] as const) {
    it(`${size} is a ${pixels} square`, async () => {
      const host = await render(
        `<su3-icon-button aria-label="x" size="${size}">${ICON}</su3-icon-button>`,
      );
      expect(style(host).width).toBe(pixels);
      expect(style(host).height).toBe(pixels);
    });
  }

  const cases = [
    ['standard', 'rgba(0, 0, 0, 0)', 'rgb(93, 100, 105)'],
    ['filled', 'rgb(0, 96, 113)', 'rgb(228, 250, 255)'],
    ['tonal', 'rgb(200, 244, 255)', 'rgb(0, 72, 86)'],
    ['outlined', 'rgba(0, 0, 0, 0)', 'rgb(0, 96, 113)'],
  ] as const;
  for (const [variant, background, color] of cases) {
    it(`${variant} uses its container and icon colors`, async () => {
      const host = await render(
        `<su3-icon-button aria-label="x" variant="${variant}">${ICON}</su3-icon-button>`,
      );
      expect(style(host).backgroundColor).toBe(background);
      expect(style(host).color).toBe(color);
    });
  }

  it('draws a visible border only for the outlined variant', async () => {
    const outlined = await render(
      `<su3-icon-button aria-label="x" variant="outlined">${ICON}</su3-icon-button>`,
    );
    expect(style(outlined).borderTopColor).toBe('rgb(128, 135, 140)');
    const standard = await render(`<su3-icon-button aria-label="x">${ICON}</su3-icon-button>`);
    expect(style(standard).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('sizes slotted icons from the control size', async () => {
    const host = await render(
      `<su3-icon-button aria-label="x" size="lg">${ICON}</su3-icon-button>`,
    );
    expect(getComputedStyle(host.querySelector('svg') as Element).width).toBe('24px');
  });

  it('follows component hooks', async () => {
    const host = await render(
      `<su3-icon-button aria-label="x" variant="filled" style="--su3-comp-icon-button-size: 64px; --su3-comp-icon-button-container-shape: 9999px; --su3-comp-icon-button-container-color: rgb(1, 2, 3)">${ICON}</su3-icon-button>`,
    );
    expect(style(host).width).toBe('64px');
    expect(style(host).borderTopLeftRadius).toBe('9999px');
    expect(style(host).backgroundColor).toBe('rgb(1, 2, 3)');
  });
});

describe('toggle', () => {
  it('exposes aria-pressed and flips on click, firing change with selected updated', async () => {
    const host = await render(
      `<su3-icon-button aria-label="Favorite" toggle>${ICON}</su3-icon-button>`,
    );
    const button = page.getByRole('button', { name: 'Favorite' });
    await expect.element(button).toHaveAttribute('aria-pressed', 'false');

    const events: string[] = [];
    host.addEventListener('change', () => events.push(`change:${String(host.selected)}`));
    await userEvent.click(button);
    expect(host.selected).toBe(true);
    await expect.element(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);
    expect(events).toEqual(['change:true', 'change:false']);
  });

  it('flips with Enter and Space from the keyboard', async () => {
    const host = await render(
      `<su3-icon-button aria-label="Favorite" toggle>${ICON}</su3-icon-button>`,
    );
    await userEvent.tab();
    expect(host.matches(':focus')).toBe(true);
    await userEvent.keyboard('{Enter}');
    expect(host.selected).toBe(true);
    await userEvent.keyboard(' ');
    expect(host.selected).toBe(false);
  });

  it('does not flip when it is not a toggle or is disabled', async () => {
    const plain = await render(`<su3-icon-button aria-label="x">${ICON}</su3-icon-button>`);
    await userEvent.click(page.getByRole('button'));
    expect(plain.selected).toBe(false);

    const disabled = await render(
      `<su3-icon-button aria-label="x" toggle disabled>${ICON}</su3-icon-button>`,
    );
    control(disabled).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(disabled.selected).toBe(false);
  });

  it('swaps to the selected icon while on', async () => {
    const host = await render(
      `<su3-icon-button aria-label="x" toggle>${ICON}<svg slot="selected" width="20" height="20" aria-hidden="true"></svg></su3-icon-button>`,
    );
    const slot = (name: string) => host.shadowRoot?.querySelector(name) as HTMLElement;
    const defaultSlot = slot('slot:not([name])');
    const selectedSlot = slot('slot[name="selected"]');
    expect(getComputedStyle(defaultSlot).display).not.toBe('none');
    expect(getComputedStyle(selectedSlot).display).toBe('none');

    await userEvent.click(page.getByRole('button'));
    await host.updateComplete;
    expect(getComputedStyle(defaultSlot).display).toBe('none');
    expect(getComputedStyle(selectedSlot).display).not.toBe('none');
  });

  it('shows the on state in the variant colors', async () => {
    const off = await render(
      `<su3-icon-button aria-label="x" variant="tonal" toggle>${ICON}</su3-icon-button>`,
    );
    const offBackground = style(off).backgroundColor;
    const on = await render(
      `<su3-icon-button aria-label="x" variant="tonal" toggle selected>${ICON}</su3-icon-button>`,
    );
    expect(style(on).backgroundColor).toBe('rgb(200, 244, 255)');
    expect(offBackground).not.toBe('rgb(200, 244, 255)');
  });
});

describe('interaction', () => {
  it('fires click events', async () => {
    const host = await render(`<su3-icon-button aria-label="Go">${ICON}</su3-icon-button>`);
    let clicks = 0;
    host.addEventListener('click', () => {
      clicks += 1;
    });
    await userEvent.click(page.getByRole('button'));
    expect(clicks).toBe(1);
  });

  it('shows a focus ring for keyboard focus only', async () => {
    const host = await render(`<su3-icon-button aria-label="Go">${ICON}</su3-icon-button>`);
    expect(style(host).outlineStyle).toBe('none');
    await userEvent.tab();
    expect(host.matches(':focus')).toBe(true);
    expect(style(host).outlineStyle).toBe('solid');
    expect(style(host).outlineColor).toBe('rgb(0, 150, 175)');
  });

  it('is disabled by the attribute and by a disabled fieldset', async () => {
    await render(`<su3-icon-button aria-label="x" disabled>${ICON}</su3-icon-button>`);
    await expect.element(page.getByRole('button')).toBeDisabled();
    await render(
      `<fieldset disabled><su3-icon-button aria-label="x">${ICON}</su3-icon-button></fieldset>`,
    );
    await expect.element(page.getByRole('button')).toBeDisabled();
  });

  it('shows a state layer on hover and mutes itself when disabled', async () => {
    const host = await render(
      `<su3-icon-button aria-label="x" variant="filled">${ICON}</su3-icon-button>`,
    );
    const layer = () => Number(getComputedStyle(control(host), '::before').opacity);
    expect(layer()).toBe(0);
    await userEvent.hover(page.getByRole('button'));
    await expect.poll(layer).toBeCloseTo(0.08, 2);

    const disabled = await render(
      `<su3-icon-button aria-label="x" variant="filled" disabled>${ICON}</su3-icon-button>`,
    );
    expect(style(disabled).backgroundColor).not.toBe('rgb(0, 96, 113)');
  });
});

describe('inside a form', () => {
  async function renderForm(attributes: string) {
    document.body.innerHTML = `<form><input name="f" value="a" /><su3-icon-button aria-label="Go" ${attributes}>${ICON}</su3-icon-button></form>`;
    const form = document.querySelector('form') as HTMLFormElement;
    const host = document.querySelector('su3-icon-button') as Su3IconButton;
    await host.updateComplete;
    const submissions: FormData[] = [];
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submissions.push(new FormData(form));
    });
    return { host, submissions };
  }

  it('does not submit by default (type button) but submits with type submit', async () => {
    const plain = await renderForm('');
    await userEvent.click(page.getByRole('button'));
    await settle();
    expect(plain.submissions).toHaveLength(0);

    const submit = await renderForm('type="submit" name="intent" value="go"');
    await userEvent.click(page.getByRole('button'));
    await expect.poll(() => submit.submissions.length).toBe(1);
    expect(submit.submissions[0]?.get('intent')).toBe('go');
  });
});
