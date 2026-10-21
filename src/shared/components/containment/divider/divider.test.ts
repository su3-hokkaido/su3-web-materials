import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import './index.ts';
import type { Su3Divider } from './divider.ts';

async function render(markup: string): Promise<Su3Divider> {
  document.body.innerHTML = markup;
  const divider = document.querySelector('su3-divider');
  if (!divider) throw new Error('No su3-divider was rendered');
  await divider.updateComplete;
  return divider;
}

const line = (host: Su3Divider): HTMLElement => {
  const element = host.shadowRoot?.querySelector<HTMLElement>('[part="divider"]');
  if (!element) throw new Error('The divider part was not rendered');
  return element;
};

const style = (host: Su3Divider) => getComputedStyle(line(host));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('accessibility', () => {
  it('is a horizontal separator by default', async () => {
    await render('<su3-divider></su3-divider>');
    const separator = page.getByRole('separator');
    await expect.element(separator).toBeVisible();
    await expect.element(separator).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('exposes a vertical separator', async () => {
    await render('<su3-divider orientation="vertical"></su3-divider>');
    await expect
      .element(page.getByRole('separator'))
      .toHaveAttribute('aria-orientation', 'vertical');
  });

  it('is ignored by assistive technology when decorative', async () => {
    const host = await render('<su3-divider decorative></su3-divider>');
    expect(line(host).getAttribute('role')).toBe('presentation');
    expect(line(host).hasAttribute('aria-orientation')).toBe(false);
    expect(page.getByRole('separator').elements()).toHaveLength(0);
  });

  it('reflects orientation, inset and decorative', async () => {
    const host = await render('<su3-divider></su3-divider>');
    expect(host.getAttribute('orientation')).toBe('horizontal');
    host.orientation = 'vertical';
    host.inset = true;
    host.decorative = true;
    await host.updateComplete;
    expect(host.getAttribute('orientation')).toBe('vertical');
    expect(host.hasAttribute('inset')).toBe(true);
    expect(host.hasAttribute('decorative')).toBe(true);
  });
});

describe('appearance (built-in light values)', () => {
  it('draws a 1px line in the border color across the container width', async () => {
    const host = await render('<div style="width: 200px"><su3-divider></su3-divider></div>');
    expect(style(host).borderTopWidth).toBe('1px');
    expect(style(host).borderTopColor).toBe('rgb(225, 233, 239)');
    expect(line(host).getBoundingClientRect().width).toBe(200);
  });

  it('leaves space at the start when inset', async () => {
    const host = await render('<div style="width: 200px"><su3-divider inset></su3-divider></div>');
    expect(style(host).marginLeft).toBe('16px');
    expect(line(host).getBoundingClientRect().width).toBe(184);
  });

  it('draws a vertical line as wide as its thickness that stretches in a row', async () => {
    const host = await render(
      '<div style="display: flex; height: 60px"><su3-divider orientation="vertical"></su3-divider></div>',
    );
    expect(style(host).borderLeftWidth).toBe('1px');
    expect(line(host).getBoundingClientRect().height).toBe(60);
  });

  it('leaves space at both ends of an inset vertical line', async () => {
    const host = await render(
      '<div style="display: flex; height: 60px"><su3-divider orientation="vertical" inset></su3-divider></div>',
    );
    expect(style(host).marginTop).toBe('16px');
    expect(style(host).marginBottom).toBe('16px');
  });

  it('follows component hooks', async () => {
    const host = await render(
      '<su3-divider style="--su3-comp-divider-color: rgb(1, 2, 3); --su3-comp-divider-thickness: 4px"></su3-divider>',
    );
    expect(style(host).borderTopColor).toBe('rgb(1, 2, 3)');
    expect(style(host).borderTopWidth).toBe('4px');
  });
});
