import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './index.ts';
import type { Su3Option } from '../option/option.ts';
import type { Su3Select } from './select.ts';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function render(markup: string): Promise<Su3Select> {
  document.body.innerHTML = markup;
  const select = document.querySelector('su3-select');
  if (!select) throw new Error('No su3-select was rendered');
  await select.updateComplete;
  await wait(30);
  await select.updateComplete;
  return select;
}

const container = (select: Su3Select): HTMLButtonElement => {
  const element = select.shadowRoot?.querySelector<HTMLButtonElement>('[part="container"]');
  if (!element) throw new Error('No container');
  return element;
};
const surface = (select: Su3Select): HTMLElement => {
  const element = select.shadowRoot?.querySelector<HTMLElement>('[part="surface"]');
  if (!element) throw new Error('No surface');
  return element;
};
const options = (select: Su3Select): Su3Option[] => [...select.querySelectorAll('su3-option')];
const shownText = (select: Su3Select): string =>
  select.shadowRoot?.querySelector('#value')?.textContent.trim() ?? '';

const basic = (
  attributes = '',
): string => `<su3-select label="Fruit" placeholder="Choose" ${attributes}
  style="margin: 20px 20px 300px; max-width: 280px">
  <su3-option value="apple">Apple</su3-option>
  <su3-option value="banana">Banana</su3-option>
  <su3-option value="cherry" disabled>Cherry</su3-option>
  <su3-option value="grape">Grape</su3-option>
</su3-select>`;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-select', () => {
  it('shows the label and the placeholder on a button that opens a listbox', async () => {
    const select = await render(basic());
    const button = page.getByRole('combobox', { name: /Fruit/ });
    await expect.element(button).toBeVisible();
    await expect.element(button).toHaveAttribute('aria-haspopup', 'listbox');
    await expect.element(button).toHaveAttribute('aria-expanded', 'false');
    expect(shownText(select)).toBe('Choose');
    await expect.element(page.getByText('Apple')).not.toBeVisible();
  });

  it('opens on click with the list in the top layer and focus on the first option', async () => {
    const select = await render(basic());
    await page.getByRole('combobox', { name: /Fruit/ }).click();
    expect(select.open).toBe(true);
    expect(surface(select).matches(':popover-open')).toBe(true);
    await expect.element(page.getByRole('listbox', { name: 'Fruit' })).toBeVisible();
    expect(document.activeElement).toBe(options(select)[0]);
    await expect
      .element(page.getByRole('combobox', { name: /Fruit/ }))
      .toHaveAttribute('aria-expanded', 'true');
  });

  it('chooses an option with a click: updates value and text, fires input then change, closes', async () => {
    const select = await render(basic());
    const seen: string[] = [];
    select.addEventListener('input', () => seen.push('input'));
    select.addEventListener('change', () => seen.push('change'));
    await page.getByRole('combobox', { name: /Fruit/ }).click();
    await page.getByRole('option', { name: 'Banana' }).click();
    expect(select.value).toBe('banana');
    expect(shownText(select)).toBe('Banana');
    expect(seen).toEqual(['input', 'change']);
    expect(select.open).toBe(false);
    expect(document.activeElement).toBe(select);
    await expect
      .element(page.getByRole('option', { name: 'Banana', includeHidden: true }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('fires no event when the chosen option is chosen again', async () => {
    const select = await render(basic('value="banana"'));
    let count = 0;
    select.addEventListener('change', () => (count += 1));
    await page.getByRole('combobox', { name: /Fruit/ }).click();
    expect(document.activeElement).toBe(options(select)[1]);
    await page.getByRole('option', { name: 'Banana' }).click();
    expect(count).toBe(0);
    expect(select.open).toBe(false);
  });

  it('ignores a disabled option and a disabled select', async () => {
    const select = await render(basic('open'));
    options(select)[2]?.click();
    expect(select.value).toBe('');
    expect(select.open).toBe(true);
    select.open = false;
    select.disabled = true;
    await select.updateComplete;
    await expect.element(page.getByRole('combobox', { name: /Fruit/ })).toBeDisabled();
  });

  it('starts with the option marked selected, and a value set later chooses the matching option', async () => {
    const select = await render(
      '<su3-select label="Fruit"><su3-option value="a">A</su3-option><su3-option value="b" selected>B</su3-option></su3-select>',
    );
    expect(select.value).toBe('b');
    expect(shownText(select)).toBe('B');
    select.value = 'a';
    await select.updateComplete;
    expect(options(select).map((option) => option.selected)).toEqual([true, false]);
    expect(shownText(select)).toBe('A');
    select.value = 'nowhere';
    await select.updateComplete;
    expect(select.value).toBe('');
    expect(shownText(select)).toBe('');
  });

  it('closes on a press outside without moving focus back', async () => {
    const select = await render(basic());
    await page.getByRole('combobox', { name: /Fruit/ }).click();
    await userEvent.click(document.body, { position: { x: 380, y: 20 } });
    expect(select.open).toBe(false);
    expect(document.activeElement).not.toBe(select);
  });

  it('shows supporting text and an explicit error', async () => {
    const select = await render(basic('supporting-text="Pick one"'));
    await expect.element(page.getByText('Pick one')).toBeVisible();
    select.errorText = 'Not allowed';
    await select.updateComplete;
    await expect.element(page.getByText('Not allowed')).toBeVisible();
    await expect
      .element(page.getByRole('combobox', { name: /Fruit/ }))
      .toHaveAttribute('aria-invalid', 'true');
  });
});

describe('touched and disabled states', () => {
  it('shows the required error after the user leaves the button, not before', async () => {
    const select = await render(
      '<form><su3-select label="Fruit" required><su3-option value="a">A</su3-option></su3-select><button>after</button></form>',
    );
    await expect
      .element(page.getByText('Please select an item in the list.'))
      .not.toBeInTheDocument();
    select.focus();
    await userEvent.tab();
    await select.updateComplete;
    await expect.element(page.getByText('Please select an item in the list.')).toBeVisible();
    await expect
      .element(page.getByRole('combobox', { name: /Fruit/ }))
      .toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the error after a failed submit', async () => {
    const select = await render(
      '<form><su3-select name="f" label="Fruit" required><su3-option value="a">A</su3-option></su3-select></form>',
    );
    select.form?.requestSubmit();
    await select.updateComplete;
    await expect.element(page.getByText('Please select an item in the list.')).toBeVisible();
  });

  it('is disabled by a disabled fieldset, and closes when it becomes disabled while open', async () => {
    const select = await render(
      '<fieldset><su3-select label="Fruit"><su3-option value="a">A</su3-option></su3-select></fieldset>',
    );
    select.open = true;
    await select.updateComplete;
    select.disabled = true;
    await select.updateComplete;
    expect(select.open).toBe(false);
    select.disabled = false;
    await select.updateComplete;
    expect(select.open).toBe(false);
    const fieldset = document.querySelector('fieldset');
    if (fieldset) fieldset.disabled = true;
    await select.updateComplete;
    await expect.element(page.getByRole('combobox', { name: /Fruit/ })).toBeDisabled();
  });

  it('is named by aria-label when there is no visible label', async () => {
    await render(
      '<su3-select aria-label="Size" placeholder="Pick"><su3-option value="s">Small</su3-option></su3-select>',
    );
    await expect.element(page.getByRole('combobox', { name: /Size/ })).toBeVisible();
  });

  it('closes on Escape from the button when every option is disabled and focus stays there', async () => {
    const select = await render(
      '<su3-select label="Fruit"><su3-option value="a" disabled>A</su3-option></su3-select>',
    );
    select.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(select.open).toBe(true);
    expect(document.activeElement).toBe(select);
    await userEvent.keyboard('{Escape}');
    expect(select.open).toBe(false);
  });

  it('does not open with the other keys, and a click while open closes it', async () => {
    const select = await render(basic());
    select.focus();
    await userEvent.keyboard('a');
    expect(select.open).toBe(false);
    await page.getByRole('combobox', { name: /Fruit/ }).click();
    expect(select.open).toBe(true);
    await page.getByRole('combobox', { name: /Fruit/ }).click();
    expect(select.open).toBe(false);
  });

  it('cannot choose a disabled option with the keyboard', async () => {
    const select = await render(basic());
    select.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('c');
    // "Cherry" is disabled, so typing "c" finds nothing and focus stays on the first option.
    expect(document.activeElement).toBe(options(select)[0]);
  });
});

describe('keyboard', () => {
  it('opens with Enter, Space and the arrows on the button', async () => {
    const select = await render(basic());
    select.focus();
    await userEvent.keyboard('{Enter}');
    expect(select.open).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(select.open).toBe(false);
    await userEvent.keyboard(' ');
    expect(select.open).toBe(true);
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{ArrowDown}');
    expect(select.open).toBe(true);
    expect(document.activeElement).toBe(options(select)[0]);
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(options(select)[3]);
  });

  it('moves with the arrow keys, wraps, skips disabled options, and jumps with Home and End', async () => {
    const select = await render(basic());
    select.focus();
    await userEvent.keyboard('{Enter}');
    const [apple, banana, , grape] = options(select);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(banana);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(grape);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(apple);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(grape);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(apple);
  });

  it('chooses with Enter and with Space, and returns focus to the button', async () => {
    const select = await render(basic());
    select.focus();
    await userEvent.keyboard('{Enter}{ArrowDown}{Enter}');
    expect(select.value).toBe('banana');
    expect(select.open).toBe(false);
    expect(document.activeElement).toBe(select);
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(options(select)[1]);
    await userEvent.keyboard('{ArrowDown} ');
    expect(select.value).toBe('grape');
  });

  it('closes on Escape and on Tab, keeping the value', async () => {
    const select = await render(basic('value="apple"'));
    select.focus();
    await userEvent.keyboard('{Enter}{Escape}');
    expect(select.open).toBe(false);
    expect(select.value).toBe('apple');
    await userEvent.keyboard('{Enter}');
    await userEvent.tab();
    expect(select.open).toBe(false);
    expect(select.value).toBe('apple');
  });

  it('moves to the option whose text starts with the typed letters', async () => {
    const select = await render(basic());
    select.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('g');
    expect(document.activeElement).toBe(options(select)[3]);
    await wait(1100);
    await userEvent.keyboard('b');
    expect(document.activeElement).toBe(options(select)[1]);
  });
});

describe('form participation and validation', () => {
  const form = (
    attributes = '',
  ): string => `<form><su3-select name="fruit" label="Fruit" ${attributes}>
    <su3-option value="apple">Apple</su3-option>
    <su3-option value="banana">Banana</su3-option>
  </su3-select></form>`;

  it('submits the chosen value under its name, and nothing while empty', async () => {
    const select = await render(form());
    const data = (): FormData => new FormData(select.form as HTMLFormElement);
    expect(data().has('fruit')).toBe(false);
    select.value = 'banana';
    await select.updateComplete;
    expect(data().get('fruit')).toBe('banana');
  });

  it('is invalid while required and empty, shows the message once touched, and becomes valid', async () => {
    const select = await render(form('required'));
    expect(select.validity.valueMissing).toBe(true);
    expect(select.checkValidity()).toBe(false);
    await select.updateComplete;
    await expect.element(page.getByText('Please select an item in the list.')).toBeVisible();
    select.value = 'apple';
    await select.updateComplete;
    expect(select.validity.valid).toBe(true);
  });

  it('shows no required error before the user has touched it', async () => {
    const select = await render(form('required'));
    expect(select.validity.valueMissing).toBe(true);
    await expect
      .element(page.getByText('Please select an item in the list.'))
      .not.toBeInTheDocument();
  });

  it('returns to the option marked selected on a form reset', async () => {
    const select = await render(
      '<form><su3-select name="fruit" label="Fruit"><su3-option value="apple">Apple</su3-option><su3-option value="banana" selected>Banana</su3-option></su3-select></form>',
    );
    select.value = 'apple';
    await select.updateComplete;
    select.form?.reset();
    await select.updateComplete;
    expect(select.value).toBe('banana');
  });

  it('applies a restored state', async () => {
    const select = await render(form());
    select.formStateRestoreCallback('banana', 'restore');
    await select.updateComplete;
    expect(select.value).toBe('banana');
  });
});

describe('placement and appearance (built-in light values)', () => {
  it('opens below the button at its width', async () => {
    const select = await render(basic('open'));
    await Promise.all(
      surface(select)
        .getAnimations()
        .map((animation) => animation.finished),
    );
    const box = container(select).getBoundingClientRect();
    const tip = surface(select).getBoundingClientRect();
    expect(tip.top).toBeGreaterThanOrEqual(box.bottom);
    expect(Math.abs(tip.left - box.left)).toBeLessThan(2);
    expect(tip.width).toBeGreaterThanOrEqual(box.width - 1);
  });

  it('flips above when there is no room below', async () => {
    const select = await render(
      `<su3-select open label="Fruit" style="margin-top: ${String(window.innerHeight - 90)}px"><su3-option value="a">A</su3-option><su3-option value="b">B</su3-option></su3-select>`,
    );
    await Promise.all(
      surface(select)
        .getAnimations()
        .map((animation) => animation.finished),
    );
    expect(surface(select).getBoundingClientRect().bottom).toBeLessThanOrEqual(
      container(select).getBoundingClientRect().top,
    );
  });

  it('follows the border hook and the filled container hook', async () => {
    // A pointer left over from an earlier test would put the button in its hover state.
    await userEvent.unhover(document.documentElement);
    const select = await render(
      basic('style="--su3-comp-select-border-color: rgb(1, 2, 3); margin: 20px"'),
    );
    expect(getComputedStyle(container(select)).borderTopColor).toBe('rgb(1, 2, 3)');
    select.variant = 'filled';
    select.style.setProperty('--su3-comp-select-container-color', 'rgb(4, 5, 6)');
    await select.updateComplete;
    expect(getComputedStyle(container(select)).backgroundColor).toBe('rgb(4, 5, 6)');
  });
});
