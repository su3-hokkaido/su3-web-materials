import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './index.ts';
import type { Su3TimePicker } from './time-picker.ts';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function render(markup: string): Promise<Su3TimePicker> {
  document.body.innerHTML = markup;
  const picker = document.querySelector('su3-time-picker');
  if (!picker) throw new Error('No su3-time-picker was rendered');
  await picker.updateComplete;
  await wait(30);
  await picker.updateComplete;
  return picker;
}

const part = (picker: Su3TimePicker, name: string): HTMLElement => {
  const element = picker.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`);
  if (!element) throw new Error(`No ${name}`);
  return element;
};

const column = (picker: Su3TimePicker, name: string): HTMLElement => {
  const element = picker.shadowRoot?.querySelector<HTMLElement>(`[data-column="${name}"]`);
  if (!element) throw new Error(`No ${name} list`);
  return element;
};

const option = (picker: Su3TimePicker, name: string, text: string): HTMLElement => {
  const element = [...column(picker, name).querySelectorAll<HTMLElement>('.option')].find(
    (candidate) => candidate.textContent.trim() === text,
  );
  if (!element) throw new Error(`No option ${text} in ${name}`);
  return element;
};

const focusedText = (picker: Su3TimePicker): string | null =>
  picker.shadowRoot?.activeElement?.textContent.trim() ?? null;

const inline = (attributes = ''): string =>
  `<su3-time-picker inline locale="en-US" label="Time" ${attributes}></su3-time-picker>`;
const field = (attributes = ''): string =>
  `<su3-time-picker locale="en-US" label="Time" placeholder="Choose" ${attributes} style="margin: 20px 20px 320px; max-width: 280px"></su3-time-picker>`;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('lists', () => {
  it('offers 24 hours and the minutes of the step on a 24-hour clock', async () => {
    const picker = await render(inline('hour-cycle="24" step="15" value="14:30"'));
    expect(column(picker, 'hour').querySelectorAll('.option')).toHaveLength(24);
    expect(column(picker, 'minute').querySelectorAll('.option')).toHaveLength(4);
    expect(picker.shadowRoot?.querySelector('[data-column="period"]')).toBeNull();
    expect(option(picker, 'hour', '14').getAttribute('aria-selected')).toBe('true');
    expect(option(picker, 'minute', '30').getAttribute('aria-selected')).toBe('true');
  });

  it('offers 1 to 12 and AM or PM on a 12-hour clock, in the order 12, 1 to 11', async () => {
    const picker = await render(inline('hour-cycle="12" value="14:30"'));
    const hours = [...column(picker, 'hour').querySelectorAll('.option')].map((item) =>
      item.textContent.trim(),
    );
    expect(hours).toEqual(['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']);
    expect(option(picker, 'hour', '2').getAttribute('aria-selected')).toBe('true');
    expect(option(picker, 'period', 'PM').getAttribute('aria-selected')).toBe('true');
    expect(option(picker, 'period', 'AM').getAttribute('aria-selected')).toBe('false');
  });

  it('follows the locale clock, and hour-cycle overrides it', async () => {
    const german = await render(
      '<su3-time-picker inline locale="de-DE" value="14:30"></su3-time-picker>',
    );
    expect(column(german, 'hour').querySelectorAll('.option')).toHaveLength(24);
    const forced = await render(
      '<su3-time-picker inline locale="de-DE" hour-cycle="12" value="14:30"></su3-time-picker>',
    );
    expect(column(forced, 'hour').querySelectorAll('.option')).toHaveLength(12);
  });

  it('names the lists and uses the label attributes', async () => {
    await render(inline('hours-label="Stunden" minutes-label="Minuten" period-label="Tageszeit"'));
    await expect.element(page.getByRole('listbox', { name: 'Stunden' })).toBeVisible();
    await expect.element(page.getByRole('listbox', { name: 'Minuten' })).toBeVisible();
    await expect.element(page.getByRole('listbox', { name: 'Tageszeit' })).toBeVisible();
  });

  it('has one tab stop per list, on the chosen option or else the first enabled one', async () => {
    const picker = await render(inline('hour-cycle="24" step="15" value="14:30" min="08:00"'));
    const stopOf = (name: string): string | undefined =>
      [...column(picker, name).querySelectorAll('.option')]
        .find((item) => item.getAttribute('tabindex') === '0')
        ?.textContent.trim();
    expect(stopOf('hour')).toBe('14');
    expect(stopOf('minute')).toBe('30');
    picker.value = '';
    await picker.updateComplete;
    expect(stopOf('hour')).toBe('08');
    expect(stopOf('minute')).toBe('00');
  });

  it('shows nothing as chosen while empty', async () => {
    const picker = await render(inline('hour-cycle="24"'));
    expect(picker.shadowRoot?.querySelectorAll('[aria-selected="true"]')).toHaveLength(0);
  });
});

describe('choosing', () => {
  it('sets the time at once with each choice and fires input then change', async () => {
    const picker = await render(inline('hour-cycle="24" step="15"'));
    const seen: string[] = [];
    picker.addEventListener('input', () => seen.push('input'));
    picker.addEventListener('change', () => seen.push('change'));
    option(picker, 'hour', '09').click();
    expect(picker.value).toBe('09:00');
    option(picker, 'minute', '45').click();
    expect(picker.value).toBe('09:45');
    expect(seen).toEqual(['input', 'change', 'input', 'change']);
    option(picker, 'minute', '45').click();
    expect(seen).toHaveLength(4);
  });

  it('keeps the minute when the hour changes and the hour when the minute changes', async () => {
    const picker = await render(inline('hour-cycle="24" step="15" value="14:30"'));
    option(picker, 'hour', '09').click();
    expect(picker.value).toBe('09:30');
    option(picker, 'minute', '15').click();
    expect(picker.value).toBe('09:15');
  });

  it('works on the 12-hour clock: 12 AM is midnight, 12 PM is noon, and AM or PM keeps the hour', async () => {
    const picker = await render(inline('hour-cycle="12" step="15"'));
    option(picker, 'hour', '12').click();
    expect(picker.value).toBe('00:00');
    option(picker, 'period', 'PM').click();
    expect(picker.value).toBe('12:00');
    option(picker, 'hour', '3').click();
    expect(picker.value).toBe('15:00');
    option(picker, 'minute', '45').click();
    expect(picker.value).toBe('15:45');
    option(picker, 'period', 'AM').click();
    expect(picker.value).toBe('03:45');
  });

  it('limits the choice to min and max and disables options that would leave the range', async () => {
    const picker = await render(
      inline('hour-cycle="24" step="15" value="12:00" min="09:30" max="17:15"'),
    );
    expect(option(picker, 'hour', '08').getAttribute('aria-disabled')).toBe('true');
    expect(option(picker, 'hour', '18').getAttribute('aria-disabled')).toBe('true');
    expect(option(picker, 'hour', '09').hasAttribute('aria-disabled')).toBe(false);
    option(picker, 'hour', '08').click();
    expect(picker.value).toBe('12:00');
    // Hour 9 only has 09:30 and 09:45 in range: choosing it moves the minute to 30.
    option(picker, 'hour', '09').click();
    expect(picker.value).toBe('09:30');
    await picker.updateComplete;
    expect(option(picker, 'minute', '00').getAttribute('aria-disabled')).toBe('true');
    expect(option(picker, 'minute', '45').hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('12-hour clock with a range', () => {
  it('can reach both halves of the day when the range spans them, and moves to an allowed hour', async () => {
    const picker = await render(
      inline('hour-cycle="12" step="15" value="12:00" min="09:00" max="17:00"'),
    );
    // AM has 09:00 to 11:45 in range, so it can be chosen; the hour moves to the nearest allowed one.
    expect(option(picker, 'period', 'AM').getAttribute('aria-disabled')).toBeNull();
    option(picker, 'period', 'AM').click();
    expect(picker.value).toBe('11:00');
    await picker.updateComplete;
    option(picker, 'hour', '9').click();
    expect(picker.value).toBe('09:00');
  });

  it('disables a half of the day that has no allowed time', async () => {
    const picker = await render(
      inline('hour-cycle="12" step="15" value="14:00" min="13:00" max="17:00"'),
    );
    expect(option(picker, 'period', 'AM').getAttribute('aria-disabled')).toBe('true');
    expect(option(picker, 'period', 'PM').getAttribute('aria-disabled')).toBeNull();
  });
});

describe('locale', () => {
  it('renders with a malformed locale instead of throwing', async () => {
    const picker = await render(
      '<su3-time-picker locale="en_US" label="Time" value="14:30"></su3-time-picker>',
    );
    await expect.element(page.getByRole('button', { name: /Time/ })).toBeVisible();
    expect(picker.value).toBe('14:30');
  });

  it('shows midnight as 00:xx on a 24-hour clock and 12:xx AM on a 12-hour clock', async () => {
    await render(field('hour-cycle="24" value="00:05"'));
    await expect.element(page.getByText('00:05')).toBeVisible();
    await render(field('hour-cycle="12" value="00:05"'));
    await expect.element(page.getByText('12:05 AM')).toBeVisible();
  });
});

describe('keyboard', () => {
  it('moves inside a list with the arrows, stopping at the ends, and jumps with Home and End', async () => {
    const picker = await render(inline('hour-cycle="24" step="15" value="14:30"'));
    option(picker, 'hour', '14').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(focusedText(picker)).toBe('15');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(focusedText(picker)).toBe('13');
    await userEvent.keyboard('{End}');
    expect(focusedText(picker)).toBe('23');
    await userEvent.keyboard('{ArrowDown}');
    expect(focusedText(picker)).toBe('23');
    await userEvent.keyboard('{Home}');
    expect(focusedText(picker)).toBe('00');
  });

  it('moves between the lists with the left and right arrows, to their tab stops', async () => {
    const picker = await render(inline('hour-cycle="12" step="15" value="14:30"'));
    option(picker, 'hour', '2').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(focusedText(picker)).toBe('30');
    await userEvent.keyboard('{ArrowRight}');
    expect(focusedText(picker)).toBe('PM');
    await userEvent.keyboard('{ArrowRight}');
    expect(focusedText(picker)).toBe('PM');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(focusedText(picker)).toBe('2');
  });

  it('chooses the focused option with Enter and with Space', async () => {
    const picker = await render(inline('hour-cycle="24" step="15" value="14:30"'));
    option(picker, 'hour', '14').focus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(picker.value).toBe('15:30');
    await userEvent.keyboard('{ArrowDown} ');
    expect(picker.value).toBe('16:30');
  });

  it('skips options that cannot be chosen', async () => {
    const picker = await render(inline('hour-cycle="24" step="15" value="12:00" max="13:00"'));
    option(picker, 'hour', '13').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(focusedText(picker)).toBe('13');
  });
});

describe('field and popup', () => {
  it('shows the label and the formatted time on a button that opens the lists', async () => {
    const picker = await render(field('hour-cycle="12" value="14:30"'));
    const button = page.getByRole('button', { name: /Time/ });
    await expect.element(button).toHaveAttribute('aria-haspopup', 'dialog');
    await expect.element(button).toHaveAttribute('aria-expanded', 'false');
    await expect.element(page.getByText('2:30 PM')).toBeVisible();
    expect(part(picker, 'surface').matches(':popover-open')).toBe(false);
    await button.click();
    expect(picker.open).toBe(true);
    expect(part(picker, 'surface').matches(':popover-open')).toBe(true);
    await expect.element(page.getByRole('listbox', { name: 'Hours' })).toBeVisible();
    await expect.element(page.getByRole('dialog', { name: 'Time' })).toBeVisible();
  });

  it('formats a 24-hour time with two digits', async () => {
    await render(field('hour-cycle="24" value="09:05"'));
    await expect.element(page.getByText('09:05')).toBeVisible();
  });

  it('shows the placeholder while empty', async () => {
    await render(field());
    await expect.element(page.getByText('Choose')).toBeVisible();
  });

  it('opens with focus on the chosen hour', async () => {
    const picker = await render(field('hour-cycle="24" value="14:30"'));
    await page.getByRole('button', { name: /Time/ }).click();
    await wait(30);
    expect(focusedText(picker)).toBe('14');
  });

  it('closes after the minutes on a 24-hour clock and returns focus to the button', async () => {
    const picker = await render(field('hour-cycle="24" step="15" value="14:30"'));
    await page.getByRole('button', { name: /Time/ }).click();
    option(picker, 'hour', '09').click();
    expect(picker.open).toBe(true);
    option(picker, 'minute', '45').click();
    expect(picker.value).toBe('09:45');
    expect(picker.open).toBe(false);
    expect(document.activeElement).toBe(picker);
    await expect.element(page.getByText('09:45')).toBeVisible();
  });

  it('closes after AM or PM on a 12-hour clock, not after the minutes', async () => {
    const picker = await render(field('hour-cycle="12" step="15" value="14:30"'));
    await page.getByRole('button', { name: /Time/ }).click();
    option(picker, 'minute', '45').click();
    expect(picker.open).toBe(true);
    option(picker, 'period', 'AM').click();
    expect(picker.value).toBe('02:45');
    expect(picker.open).toBe(false);
  });

  it('opens with ArrowDown and closes with Escape, returning focus', async () => {
    const picker = await render(field('hour-cycle="24" value="14:30"'));
    picker.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(picker.open).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(picker.open).toBe(false);
    expect(document.activeElement).toBe(picker);
  });

  it('closes on a press outside without moving focus back', async () => {
    const picker = await render(field('hour-cycle="24" value="14:30"'));
    await page.getByRole('button', { name: /Time/ }).click();
    await userEvent.click(document.body, { position: { x: 380, y: 10 } });
    expect(picker.open).toBe(false);
    expect(document.activeElement).not.toBe(picker);
  });

  it('opens below the button at its start edge', async () => {
    const picker = await render(field('hour-cycle="24" value="14:30" open'));
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
    const picker = await render(field('hour-cycle="24" value="14:30" open'));
    part(picker, 'container').focus();
    await userEvent.keyboard('{Escape}');
    expect(picker.open).toBe(false);
  });

  it('ignores other keys on the button, and a click while open closes the popup', async () => {
    const picker = await render(field('hour-cycle="24" value="14:30"'));
    picker.focus();
    await userEvent.keyboard('x');
    expect(picker.open).toBe(false);
    await page.getByRole('button', { name: /Time/ }).click();
    expect(picker.open).toBe(true);
    await page.getByRole('button', { name: /Time/ }).click();
    expect(picker.open).toBe(false);
  });

  it('shows every option as unavailable when min is after max, without throwing', async () => {
    const picker = await render(inline('hour-cycle="24" min="18:00" max="09:00"'));
    expect(
      [...(picker.shadowRoot?.querySelectorAll('.option') ?? [])].every(
        (item) => item.getAttribute('aria-disabled') === 'true',
      ),
    ).toBe(true);
  });

  it('cannot be opened while disabled', async () => {
    const picker = await render(field('disabled'));
    await expect.element(page.getByRole('button', { name: /Time/ })).toBeDisabled();
    picker.open = true;
    await picker.updateComplete;
    expect(part(picker, 'surface').matches(':popover-open')).toBe(false);
  });
});

describe('form participation and validation', () => {
  const form = (attributes = ''): string =>
    `<form><su3-time-picker name="at" locale="en-US" label="Time" hour-cycle="24" ${attributes}></su3-time-picker></form>`;

  it('submits the 24-hour time under its name, and nothing while empty', async () => {
    const picker = await render(form());
    const data = (): FormData => new FormData(picker.form as HTMLFormElement);
    expect(data().has('at')).toBe(false);
    picker.value = '09:05';
    await picker.updateComplete;
    expect(data().get('at')).toBe('09:05');
  });

  it('is invalid while required and empty and shows the message after a failed submit', async () => {
    const picker = await render(form('required'));
    expect(picker.validity.valueMissing).toBe(true);
    picker.form?.requestSubmit();
    await picker.updateComplete;
    await expect.element(page.getByText('Please choose a time.')).toBeVisible();
    picker.value = '09:05';
    await picker.updateComplete;
    expect(picker.validity.valid).toBe(true);
  });

  it('is out of range, off the step, or bad input when the value says so', async () => {
    const picker = await render(form('min="09:00" max="17:00" step="15" value="08:00"'));
    expect(picker.validity.rangeUnderflow).toBe(true);
    picker.value = '18:00';
    await picker.updateComplete;
    expect(picker.validity.rangeOverflow).toBe(true);
    picker.value = '12:10';
    await picker.updateComplete;
    expect(picker.validity.stepMismatch).toBe(true);
    picker.value = 'noon';
    await picker.updateComplete;
    expect(picker.validity.badInput).toBe(true);
    picker.value = '12:15';
    await picker.updateComplete;
    expect(picker.validity.valid).toBe(true);
  });

  it('returns to the value attribute on a form reset, and applies a restored state', async () => {
    const picker = await render(form('value="09:05"'));
    picker.value = '10:10';
    await picker.updateComplete;
    picker.form?.reset();
    await picker.updateComplete;
    expect(picker.value).toBe('09:05');
    picker.formStateRestoreCallback('11:11', 'restore');
    await picker.updateComplete;
    expect(picker.value).toBe('11:11');
  });
});

describe('appearance (built-in light values)', () => {
  it('has the chosen option in the accent color and follows the hook', async () => {
    const picker = await render(
      inline(
        'hour-cycle="24" value="14:30" style="--su3-comp-time-picker-selected-color: rgb(1, 2, 3)"',
      ),
    );
    expect(getComputedStyle(option(picker, 'hour', '14')).backgroundColor).toBe('rgb(1, 2, 3)');
    expect(getComputedStyle(option(picker, 'hour', '15')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('puts the lists side by side and scrolls a tall list on its own', async () => {
    const picker = await render(inline('hour-cycle="24" value="14:30"'));
    const hours = column(picker, 'hour').getBoundingClientRect();
    const minutes = column(picker, 'minute').getBoundingClientRect();
    expect(minutes.left).toBeGreaterThanOrEqual(hours.right - 1);
    expect(column(picker, 'hour').scrollHeight).toBeGreaterThan(
      column(picker, 'hour').clientHeight,
    );
  });
});
