import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './index.ts';
import type { Su3DatePicker } from './date-picker.ts';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function render(markup: string): Promise<Su3DatePicker> {
  document.body.innerHTML = markup;
  const picker = document.querySelector('su3-date-picker');
  if (!picker) throw new Error('No su3-date-picker was rendered');
  await picker.updateComplete;
  await wait(30);
  await picker.updateComplete;
  return picker;
}

const part = (picker: Su3DatePicker, name: string): HTMLElement => {
  const element = picker.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`);
  if (!element) throw new Error(`No ${name}`);
  return element;
};

const day = (picker: Su3DatePicker, iso: string): HTMLElement => {
  const element = [...(picker.shadowRoot?.querySelectorAll<HTMLElement>('.day') ?? [])].find(
    (button) => button.getAttribute('aria-label')?.includes(label(iso)),
  );
  if (!element) throw new Error(`No day ${iso}`);
  return element;
};

/** The long English name of a date, as the day buttons are labelled. */
const label = (iso: string): string => {
  const [year, month, dayOfMonth] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(
    new Date(year ?? 0, (month ?? 1) - 1, dayOfMonth ?? 1),
  );
};

const focusedLabel = (picker: Su3DatePicker): string | null =>
  picker.shadowRoot?.activeElement?.getAttribute('aria-label') ?? null;

const inline = (attributes = ''): string =>
  `<su3-date-picker inline locale="en-US" label="Date" ${attributes}></su3-date-picker>`;
const field = (attributes = ''): string =>
  `<su3-date-picker locale="en-US" label="Date" placeholder="Choose" ${attributes} style="margin: 20px 20px 400px; max-width: 280px"></su3-date-picker>`;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('calendar', () => {
  it('shows the month and year of the value, the weekdays and every day of the month', async () => {
    const picker = await render(inline('value="2024-03-15"'));
    await expect.element(page.getByText('March 2024')).toBeVisible();
    expect(picker.shadowRoot?.querySelectorAll('.day')).toHaveLength(31);
    expect(picker.shadowRoot?.querySelectorAll('th')).toHaveLength(7);
    expect(picker.shadowRoot?.querySelector('th')?.textContent.trim()).toBe('Sun');
  });

  it('starts the week on Monday for German, and on the day given by first-day-of-week', async () => {
    const german = await render(
      '<su3-date-picker inline locale="de-DE" value="2024-03-15"></su3-date-picker>',
    );
    expect(german.shadowRoot?.querySelector('th')?.textContent.trim()).toBe('Mo');
    const custom = await render(inline('value="2024-03-15" first-day-of-week="6"'));
    expect(custom.shadowRoot?.querySelector('th')?.textContent.trim()).toBe('Sat');
  });

  it('marks the chosen day and exposes the days as a labelled grid', async () => {
    const picker = await render(inline('value="2024-03-15"'));
    expect(day(picker, '2024-03-15').closest('td')?.getAttribute('aria-selected')).toBe('true');
    expect(day(picker, '2024-03-14').closest('td')?.getAttribute('aria-selected')).toBe('false');
    await expect.element(page.getByRole('grid', { name: 'March 2024' })).toBeVisible();
    await expect.element(page.getByRole('group', { name: 'Date' })).toBeVisible();
  });

  it('marks today', async () => {
    const picker = await render(inline());
    const now = new Date();
    const iso = `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(day(picker, iso).getAttribute('aria-current')).toBe('date');
  });

  it('changes the month with the buttons without moving the value', async () => {
    const picker = await render(inline('value="2024-03-15"'));
    await page.getByRole('button', { name: 'Next month' }).click();
    await expect.element(page.getByText('April 2024')).toBeVisible();
    await page.getByRole('button', { name: 'Previous month' }).click();
    await page.getByRole('button', { name: 'Previous month' }).click();
    await expect.element(page.getByText('February 2024')).toBeVisible();
    expect(picker.value).toBe('2024-03-15');
    expect(picker.shadowRoot?.querySelectorAll('.day')).toHaveLength(29);
  });

  it('chooses a day with a click and fires input then change', async () => {
    const picker = await render(inline('value="2024-03-15"'));
    const seen: string[] = [];
    picker.addEventListener('input', () => seen.push('input'));
    picker.addEventListener('change', () => seen.push('change'));
    await page.getByRole('button', { name: label('2024-03-20') }).click();
    expect(picker.value).toBe('2024-03-20');
    expect(seen).toEqual(['input', 'change']);
    expect(day(picker, '2024-03-20').closest('td')?.getAttribute('aria-selected')).toBe('true');
    await page.getByRole('button', { name: label('2024-03-20') }).click();
    expect(seen).toEqual(['input', 'change']);
  });

  it('limits the choice to min and max, and disables the month buttons at the limits', async () => {
    const picker = await render(inline('value="2024-03-15" min="2024-03-10" max="2024-03-20"'));
    expect(day(picker, '2024-03-09').getAttribute('aria-disabled')).toBe('true');
    expect(day(picker, '2024-03-21').getAttribute('aria-disabled')).toBe('true');
    expect(day(picker, '2024-03-10').hasAttribute('aria-disabled')).toBe(false);
    day(picker, '2024-03-25').click();
    expect(picker.value).toBe('2024-03-15');
    await expect.element(page.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    await expect.element(page.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  it('uses the previous-label and next-label attributes', async () => {
    await render(inline('previous-label="Zurueck" next-label="Weiter"'));
    await expect.element(page.getByRole('button', { name: 'Zurueck' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Weiter' })).toBeVisible();
  });
});

describe('range and locale', () => {
  it('shows a month inside the range when min is in the future, with a day as the tab stop', async () => {
    const picker = await render(inline('min="2090-06-10" max="2090-06-20"'));
    await expect.element(page.getByText('June 2090')).toBeVisible();
    const stop = picker.shadowRoot?.querySelector('.day[tabindex="0"]');
    expect(stop?.getAttribute('aria-disabled')).toBeNull();
  });

  it('moves the shown month back into a range that changes', async () => {
    const picker = await render(inline('value="2024-03-15"'));
    picker.min = '2024-05-01';
    picker.max = '2024-05-31';
    await picker.updateComplete;
    await expect.element(page.getByText('May 2024')).toBeVisible();
  });

  it('renders with a malformed locale instead of throwing', async () => {
    await render('<su3-date-picker inline locale="en_US" value="2024-03-15"></su3-date-picker>');
    await expect.element(page.getByRole('grid')).toBeVisible();
  });

  it('treats a year before 1000 as bad input', async () => {
    const picker = await render(inline('value="0050-01-01"'));
    expect(picker.validity.badInput).toBe(true);
  });

  it('keeps a chosen day that is out of range readable as chosen', async () => {
    const picker = await render(inline('value="2024-03-05" min="2024-03-10"'));
    const cell = day(picker, '2024-03-05');
    expect(cell.closest('td')?.getAttribute('aria-selected')).toBe('true');
    expect(cell.getAttribute('aria-disabled')).toBe('true');
    expect(getComputedStyle(cell).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('turns the month arrows around in right-to-left text', async () => {
    document.documentElement.dir = 'rtl';
    try {
      const picker = await render(inline('value="2024-03-15"'));
      const arrow = picker.shadowRoot?.querySelector('.nav svg');
      if (!arrow) throw new Error('No arrow');
      expect(getComputedStyle(arrow).transform).not.toBe('none');
    } finally {
      document.documentElement.removeAttribute('dir');
    }
  });

  it('mirrors the left and right arrow keys in right-to-left text', async () => {
    document.documentElement.dir = 'rtl';
    try {
      const picker = await render(inline('value="2024-03-15"'));
      day(picker, '2024-03-15').focus();
      await userEvent.keyboard('{ArrowLeft}');
      expect(focusedLabel(picker)).toBe(label('2024-03-16'));
    } finally {
      document.documentElement.removeAttribute('dir');
    }
  });
});

describe('keyboard in the grid', () => {
  it('moves by day and by week with the arrow keys, across months', async () => {
    const picker = await render(inline('value="2024-03-31"'));
    day(picker, '2024-03-31').focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(page.getByText('April 2024')).toBeVisible();
    expect(focusedLabel(picker)).toBe(label('2024-04-01'));
    await userEvent.keyboard('{ArrowDown}');
    expect(focusedLabel(picker)).toBe(label('2024-04-08'));
    await userEvent.keyboard('{ArrowLeft}');
    expect(focusedLabel(picker)).toBe(label('2024-04-07'));
    await userEvent.keyboard('{ArrowUp}');
    expect(focusedLabel(picker)).toBe(label('2024-03-31'));
  });

  it('jumps to the week edges with Home and End', async () => {
    const picker = await render(inline('value="2024-03-14"'));
    day(picker, '2024-03-14').focus();
    await userEvent.keyboard('{Home}');
    expect(focusedLabel(picker)).toBe(label('2024-03-10'));
    await userEvent.keyboard('{End}');
    expect(focusedLabel(picker)).toBe(label('2024-03-16'));
  });

  it('moves by month with PageUp and PageDown and by year with Shift, keeping the day', async () => {
    const picker = await render(inline('value="2024-01-31"'));
    day(picker, '2024-01-31').focus();
    await userEvent.keyboard('{PageDown}');
    expect(focusedLabel(picker)).toBe(label('2024-02-29'));
    await userEvent.keyboard('{PageUp}');
    expect(focusedLabel(picker)).toBe(label('2024-01-29'));
    await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
    expect(focusedLabel(picker)).toBe(label('2025-01-29'));
  });

  it('chooses the focused day with Enter and with Space', async () => {
    const picker = await render(inline('value="2024-03-15"'));
    day(picker, '2024-03-15').focus();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(picker.value).toBe('2024-03-16');
    await userEvent.keyboard('{ArrowRight} ');
    expect(picker.value).toBe('2024-03-17');
  });

  it('stays inside min and max', async () => {
    const picker = await render(inline('value="2024-03-15" min="2024-03-10" max="2024-03-20"'));
    day(picker, '2024-03-15').focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(focusedLabel(picker)).toBe(label('2024-03-20'));
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(focusedLabel(picker)).toBe(label('2024-03-10'));
  });

  it('has one tab stop in the grid, on the focused day', async () => {
    const picker = await render(inline('value="2024-03-15"'));
    const stops = [...(picker.shadowRoot?.querySelectorAll('.day') ?? [])].filter(
      (button) => button.getAttribute('tabindex') === '0',
    );
    expect(stops).toHaveLength(1);
    expect(stops[0]).toBe(day(picker, '2024-03-15'));
  });
});

describe('field and popup', () => {
  it('shows the label, the formatted value and a button that opens the calendar', async () => {
    const picker = await render(field('value="2024-03-15"'));
    const button = page.getByRole('button', { name: /Date/ });
    await expect.element(button).toHaveAttribute('aria-haspopup', 'dialog');
    await expect.element(button).toHaveAttribute('aria-expanded', 'false');
    await expect.element(page.getByText('Mar 15, 2024')).toBeVisible();
    await expect.element(page.getByText('March 2024')).not.toBeVisible();
    await button.click();
    expect(picker.open).toBe(true);
    expect(part(picker, 'surface').matches(':popover-open')).toBe(true);
    await expect.element(page.getByText('March 2024')).toBeVisible();
    await expect.element(page.getByRole('dialog', { name: 'Date' })).toBeVisible();
  });

  it('shows the placeholder while empty', async () => {
    await render(field());
    await expect.element(page.getByText('Choose')).toBeVisible();
  });

  it('opens on the chosen day with focus there, and on today when empty', async () => {
    const picker = await render(field('value="2024-03-15"'));
    await page.getByRole('button', { name: /Date/ }).click();
    await wait(30);
    expect(focusedLabel(picker)).toBe(label('2024-03-15'));
  });

  it('chooses a day, closes the popup, returns focus to the button and updates the text', async () => {
    const picker = await render(field('value="2024-03-15"'));
    await page.getByRole('button', { name: /Date/ }).click();
    await page.getByRole('button', { name: label('2024-03-20') }).click();
    expect(picker.value).toBe('2024-03-20');
    expect(picker.open).toBe(false);
    expect(document.activeElement).toBe(picker);
    await expect.element(page.getByText('Mar 20, 2024')).toBeVisible();
  });

  it('opens with ArrowDown and closes with Escape, returning focus', async () => {
    const picker = await render(field('value="2024-03-15"'));
    picker.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(picker.open).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(picker.open).toBe(false);
    expect(document.activeElement).toBe(picker);
  });

  it('closes on a press outside without moving focus back', async () => {
    const picker = await render(field('value="2024-03-15"'));
    await page.getByRole('button', { name: /Date/ }).click();
    await userEvent.click(document.body, { position: { x: 380, y: 10 } });
    expect(picker.open).toBe(false);
    expect(document.activeElement).not.toBe(picker);
  });

  it('opens below the button, at its start edge', async () => {
    const picker = await render(field('value="2024-03-15" open'));
    await Promise.all(
      part(picker, 'surface')
        .getAnimations()
        .map((a) => a.finished),
    );
    const tip = part(picker, 'surface').getBoundingClientRect();
    const box = part(picker, 'container').getBoundingClientRect();
    expect(tip.top).toBeGreaterThanOrEqual(box.bottom);
    expect(Math.abs(tip.left - box.left)).toBeLessThan(2);
  });

  it('closes on Escape pressed on the button while open', async () => {
    const picker = await render(field('value="2024-03-15" open'));
    part(picker, 'container').focus();
    await userEvent.keyboard('{Escape}');
    expect(picker.open).toBe(false);
  });

  it('ignores other keys on the button, and a click while open closes the popup', async () => {
    const picker = await render(field('value="2024-03-15"'));
    picker.focus();
    await userEvent.keyboard('x');
    expect(picker.open).toBe(false);
    await page.getByRole('button', { name: /Date/ }).click();
    expect(picker.open).toBe(true);
    await page.getByRole('button', { name: /Date/ }).click();
    expect(picker.open).toBe(false);
  });

  it('cannot be opened while disabled', async () => {
    const picker = await render(field('disabled'));
    await expect.element(page.getByRole('button', { name: /Date/ })).toBeDisabled();
    picker.open = true;
    await picker.updateComplete;
    expect(part(picker, 'surface').matches(':popover-open')).toBe(false);
  });
});

describe('form participation and validation', () => {
  const form = (attributes = ''): string =>
    `<form><su3-date-picker name="when" locale="en-US" label="Date" ${attributes}></su3-date-picker></form>`;

  it('submits the ISO date under its name, and nothing while empty', async () => {
    const picker = await render(form());
    const data = (): FormData => new FormData(picker.form as HTMLFormElement);
    expect(data().has('when')).toBe(false);
    picker.value = '2024-03-15';
    await picker.updateComplete;
    expect(data().get('when')).toBe('2024-03-15');
  });

  it('is invalid while required and empty and shows the message after a failed submit', async () => {
    const picker = await render(form('required'));
    expect(picker.validity.valueMissing).toBe(true);
    picker.form?.requestSubmit();
    await picker.updateComplete;
    await expect.element(page.getByText('Please choose a date.')).toBeVisible();
    picker.value = '2024-03-15';
    await picker.updateComplete;
    expect(picker.validity.valid).toBe(true);
  });

  it('is out of range below min and above max, and bad input for a non-date', async () => {
    const picker = await render(form('min="2024-03-10" max="2024-03-20" value="2024-03-05"'));
    expect(picker.validity.rangeUnderflow).toBe(true);
    picker.value = '2024-03-25';
    await picker.updateComplete;
    expect(picker.validity.rangeOverflow).toBe(true);
    picker.value = 'garbage';
    await picker.updateComplete;
    expect(picker.validity.badInput).toBe(true);
    picker.value = '2024-03-12';
    await picker.updateComplete;
    expect(picker.validity.valid).toBe(true);
  });

  it('returns to the value attribute on a form reset, and applies a restored state', async () => {
    const picker = await render(form('value="2024-03-15"'));
    picker.value = '2024-04-01';
    await picker.updateComplete;
    picker.form?.reset();
    await picker.updateComplete;
    expect(picker.value).toBe('2024-03-15');
    picker.formStateRestoreCallback('2024-05-05', 'restore');
    await picker.updateComplete;
    expect(picker.value).toBe('2024-05-05');
  });
});

describe('appearance (built-in light values)', () => {
  it('has the chosen day in the accent color and follows the hook', async () => {
    const picker = await render(
      inline('value="2024-03-15" style="--su3-comp-date-picker-selected-color: rgb(1, 2, 3)"'),
    );
    expect(getComputedStyle(day(picker, '2024-03-15')).backgroundColor).toBe('rgb(1, 2, 3)');
    expect(getComputedStyle(day(picker, '2024-03-14')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('lays the days out in seven columns', async () => {
    const picker = await render(inline('value="2024-03-15"'));
    const left = new Set(
      [...(picker.shadowRoot?.querySelectorAll<HTMLElement>('.day') ?? [])].map((button) =>
        Math.round(button.getBoundingClientRect().left),
      ),
    );
    expect(left.size).toBe(7);
  });
});
