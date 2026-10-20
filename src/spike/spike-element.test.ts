import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './spike-element.ts';
import type { Su3Spike } from './spike-element.ts';

async function render(markup: string): Promise<Su3Spike> {
  document.body.innerHTML = markup;
  const element = document.querySelector('su3-spike');
  if (!element) throw new Error('su3-spike was not rendered');
  await element.updateComplete;
  return element;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-spike', () => {
  it('uses the constructor defaults', async () => {
    const element = await render('<su3-spike>Go</su3-spike>');
    expect(element.variant).toBe('a');
    expect(element.disabled).toBe(false);
  });

  it('reads attributes and reflects properties', async () => {
    const element = await render('<su3-spike variant="b" disabled>Go</su3-spike>');
    expect(element.variant).toBe('b');
    expect(element.disabled).toBe(true);

    element.variant = 'a';
    await element.updateComplete;
    expect(element.getAttribute('variant')).toBe('a');
  });

  it('exposes a button through the shadow root and reacts to clicks', async () => {
    const element = await render('<su3-spike>Go</su3-spike>');
    let clicks = 0;
    element.addEventListener('spike-click', () => {
      clicks += 1;
    });

    const button = page.getByRole('button', { name: 'Go' });
    await expect.element(button).toBeEnabled();
    await userEvent.click(button);
    expect(clicks).toBe(1);
  });

  it('disables the inner button', async () => {
    await render('<su3-spike disabled>Go</su3-spike>');
    await expect.element(page.getByRole('button', { name: 'Go' })).toBeDisabled();
  });
});
