import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import './index.ts';
import type { Su3Option } from './option.ts';

async function render(markup: string): Promise<Su3Option> {
  document.body.innerHTML = markup;
  const option = document.querySelector('su3-option');
  if (!option) throw new Error('No su3-option was rendered');
  await option.updateComplete;
  return option;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-option', () => {
  it('has the option role, is named by its text and reflects selected', async () => {
    const option = await render('<su3-option value="a">Apple</su3-option>');
    const role = page.getByRole('option', { name: 'Apple' });
    await expect.element(role).toHaveAttribute('aria-selected', 'false');
    option.selected = true;
    await option.updateComplete;
    await expect.element(role).toHaveAttribute('aria-selected', 'true');
  });

  it('is exposed as disabled', async () => {
    await render('<su3-option disabled>Cherry</su3-option>');
    await expect
      .element(page.getByRole('option', { name: 'Cherry' }))
      .toHaveAttribute('aria-disabled', 'true');
  });

  it('gives its own text as the label, without the leading content', async () => {
    const option = await render(
      '<su3-option><svg slot="leading" width="20" height="20" aria-hidden="true"></svg> Apple pie </su3-option>',
    );
    expect(option.label).toBe('Apple pie');
  });

  it('tints the chosen option and follows the hook', async () => {
    const option = await render(
      '<su3-option selected style="--su3-comp-select-option-selected-color: rgb(1, 2, 3)">Apple</su3-option>',
    );
    const row = option.shadowRoot?.querySelector('[part="option"]');
    if (!row) throw new Error('No row');
    expect(getComputedStyle(row).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('is at least the large control height', async () => {
    const option = await render('<su3-option>Apple</su3-option>');
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    expect(option.getBoundingClientRect().height).toBeGreaterThanOrEqual(3 * rem - 1);
  });
});
