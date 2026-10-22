import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import './index.ts';
import type { Su3Badge } from './badge.ts';

async function render(markup: string): Promise<Su3Badge> {
  document.body.innerHTML = markup;
  const badge = document.querySelector('su3-badge');
  if (!badge) throw new Error('No su3-badge was rendered');
  await badge.updateComplete;
  return badge;
}

const pill = (host: Su3Badge): HTMLElement => {
  const element = host.shadowRoot?.querySelector<HTMLElement>('[part="badge"]');
  if (!element) throw new Error('The badge part was not rendered');
  return element;
};

const style = (host: Su3Badge) => getComputedStyle(pill(host));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('content', () => {
  it('shows slotted text without adding a role', async () => {
    const host = await render('<su3-badge>New</su3-badge>');
    await expect.element(page.getByText('New')).toBeVisible();
    expect(pill(host).getAttribute('role')).toBeNull();
  });

  it('shows a count, including zero', async () => {
    const host = await render('<su3-badge count="0">ignored</su3-badge>');
    expect(pill(host).textContent.trim()).toBe('0');
    host.count = 7;
    await host.updateComplete;
    expect(pill(host).textContent.trim()).toBe('7');
  });

  it('shows max+ above the maximum and names the image with the full count', async () => {
    const host = await render('<su3-badge count="120"></su3-badge>');
    expect(pill(host).textContent.trim()).toBe('99+');
    await expect.element(page.getByRole('img', { name: '120' })).toBeVisible();

    host.max = 150;
    await host.updateComplete;
    expect(pill(host).textContent.trim()).toBe('120');
    expect(pill(host).getAttribute('role')).toBeNull();

    host.max = 9;
    host.count = 10;
    await host.updateComplete;
    expect(pill(host).textContent.trim()).toBe('9+');
  });

  it('shows a dot as an image named by aria-label', async () => {
    const host = await render('<su3-badge dot aria-label="Online">text</su3-badge>');
    await expect.element(page.getByRole('img', { name: 'Online' })).toBeVisible();
    expect(pill(host).textContent.trim()).toBe('');
    expect(style(host).width).toBe('8px');
    expect(style(host).height).toBe('8px');
  });

  it('renders a dot without a name when aria-label is missing', async () => {
    const host = await render('<su3-badge dot></su3-badge>');
    expect(pill(host).getAttribute('role')).toBe('img');
    expect(pill(host).hasAttribute('aria-label')).toBe(false);
  });

  it('is not focusable', async () => {
    const host = await render('<su3-badge>New</su3-badge>');
    expect(host.hasAttribute('tabindex')).toBe(false);
  });
});

describe('tones (built-in light values)', () => {
  it('is accent by default', async () => {
    const host = await render('<su3-badge>New</su3-badge>');
    expect(host.tone).toBe('accent');
    expect(style(host).backgroundColor).toBe('rgb(0, 96, 113)');
    expect(style(host).color).toBe('rgb(228, 250, 255)');
    expect(style(host).height).toBe('20px');
    expect(style(host).borderTopLeftRadius).not.toBe('0px');
  });

  it('subtle, danger and neutral change the colors', async () => {
    const colors = new Set<string>();
    for (const tone of ['accent', 'subtle', 'danger', 'neutral']) {
      const host = await render(`<su3-badge tone="${tone}">x</su3-badge>`);
      colors.add(style(host).backgroundColor);
    }
    expect(colors.size).toBe(4);
  });

  it('neutral has a visible border and the others do not', async () => {
    const neutral = await render('<su3-badge tone="neutral">x</su3-badge>');
    expect(style(neutral).borderTopColor).toBe('rgb(225, 233, 239)');
    const accent = await render('<su3-badge>x</su3-badge>');
    expect(style(accent).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('reflects tone and dot', async () => {
    const host = await render('<su3-badge>x</su3-badge>');
    host.tone = 'danger';
    host.dot = true;
    await host.updateComplete;
    expect(host.getAttribute('tone')).toBe('danger');
    expect(host.hasAttribute('dot')).toBe(true);
  });
});

describe('neutral dot', () => {
  it('is filled with a visible color instead of the sunken tint', async () => {
    const host = await render('<su3-badge dot tone="neutral" aria-label="Unknown"></su3-badge>');
    expect(style(host).backgroundColor).toBe('rgb(93, 100, 105)');
  });
});

describe('component hooks', () => {
  it('follows the --su3-comp-badge-* hooks', async () => {
    const host = await render(
      '<su3-badge style="--su3-comp-badge-container-color: rgb(1, 2, 3); --su3-comp-badge-label-color: rgb(4, 5, 6); --su3-comp-badge-height: 32px; --su3-comp-badge-container-shape: 4px">x</su3-badge>',
    );
    expect(style(host).backgroundColor).toBe('rgb(1, 2, 3)');
    expect(style(host).color).toBe('rgb(4, 5, 6)');
    expect(style(host).height).toBe('32px');
    expect(style(host).borderTopLeftRadius).toBe('4px');
  });

  it('sizes the dot with its own hook', async () => {
    const host = await render(
      '<su3-badge dot style="--su3-comp-badge-dot-size: 12px" aria-label="x"></su3-badge>',
    );
    expect(style(host).width).toBe('12px');
  });
});
