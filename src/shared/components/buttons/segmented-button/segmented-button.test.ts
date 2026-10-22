import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './index.ts';
import type { Su3Segment } from '../segment/segment.ts';
import type { Su3SegmentedButton } from './segmented-button.ts';

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

async function render(markup: string): Promise<Su3SegmentedButton> {
  document.body.innerHTML = markup;
  const group = document.querySelector('su3-segmented-button');
  if (!group) throw new Error('No su3-segmented-button was rendered');
  await group.updateComplete;
  await settle();
  await group.updateComplete;
  return group;
}

const segments = (group: Su3SegmentedButton): Su3Segment[] => [
  ...group.querySelectorAll('su3-segment'),
];

const single = `<su3-segmented-button aria-label="Range" name="range">
  <su3-segment value="day">Day</su3-segment>
  <su3-segment value="week" selected>Week</su3-segment>
  <su3-segment value="month">Month</su3-segment>
</su3-segmented-button>`;

const multiple = `<su3-segmented-button aria-label="Filters" name="f" multiple>
  <su3-segment value="free" selected>Free</su3-segment>
  <su3-segment value="paid">Paid</su3-segment>
  <su3-segment value="trial" selected>Trial</su3-segment>
</su3-segmented-button>`;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('single selection: roles and state', () => {
  it('is a radio group named by aria-label, with the selected segment checked', async () => {
    await render(single);
    await expect.element(page.getByRole('radiogroup', { name: 'Range' })).toBeVisible();
    await expect.element(page.getByRole('radio', { name: 'Week' })).toBeChecked();
    await expect.element(page.getByRole('radio', { name: 'Day' })).not.toBeChecked();
  });

  it('derives value from the selected segment and keeps only the first selected one', async () => {
    const group = await render(
      '<su3-segmented-button><su3-segment value="a" selected>A</su3-segment><su3-segment value="b" selected>B</su3-segment></su3-segmented-button>',
    );
    expect(group.value).toBe('a');
    expect(segments(group).map((segment) => segment.selected)).toEqual([true, false]);
  });

  it('selects the segment named by value, also when set later', async () => {
    const group = await render(single);
    group.value = 'month';
    await group.updateComplete;
    expect(segments(group).map((segment) => segment.selected)).toEqual([false, false, true]);
    group.value = '';
    await group.updateComplete;
    expect(segments(group).some((segment) => segment.selected)).toBe(false);
  });

  it('a value set before the segments exist wins over selected attributes', async () => {
    const group = await render(
      single.replace('<su3-segmented-button', '<su3-segmented-button value="day"'),
    );
    expect(group.value).toBe('day');
    await expect.element(page.getByRole('radio', { name: 'Day' })).toBeChecked();
  });

  it('marks the outer corners by position and sets the size on every segment', async () => {
    const group = await render(
      single.replace('<su3-segmented-button', '<su3-segmented-button size="lg"'),
    );
    expect(segments(group).map((segment) => segment.position)).toEqual(['first', 'middle', 'last']);
    expect(segments(group).every((segment) => segment.size === 'lg')).toBe(true);
    const only = await render(
      '<su3-segmented-button><su3-segment value="a">A</su3-segment></su3-segmented-button>',
    );
    expect(segments(only)[0]?.position).toBe('only');
  });
});

describe('single selection: interaction', () => {
  it('selects on click and fires input then change once each', async () => {
    const group = await render(single);
    const events: string[] = [];
    group.addEventListener('input', () => events.push(`input:${group.value}`));
    group.addEventListener('change', () => events.push(`change:${group.value}`));
    await userEvent.click(page.getByRole('radio', { name: 'Day' }));
    expect(group.value).toBe('day');
    expect(events).toEqual(['input:day', 'change:day']);
    await expect.element(page.getByRole('radio', { name: 'Day' })).toBeChecked();
    await expect.element(page.getByRole('radio', { name: 'Week' })).not.toBeChecked();
  });

  it('does not deselect or fire events when the selected segment is clicked again', async () => {
    const group = await render(single);
    let fired = 0;
    group.addEventListener('change', () => (fired += 1));
    await userEvent.click(page.getByRole('radio', { name: 'Week' }));
    expect(group.value).toBe('week');
    expect(fired).toBe(0);
  });

  it('has one tab stop: the selected segment', async () => {
    const group = await render(single);
    const stops = segments(group).map((segment) => segment.tabbable);
    expect(stops).toEqual([false, true, false]);
    await userEvent.tab();
    expect(document.activeElement).toBe(segments(group)[1]);
  });

  it('falls back to the first enabled segment when nothing is selected', async () => {
    const group = await render(
      '<su3-segmented-button><su3-segment value="a" disabled>A</su3-segment><su3-segment value="b">B</su3-segment></su3-segmented-button>',
    );
    expect(segments(group).map((segment) => segment.tabbable)).toEqual([false, true]);
  });

  it('moves and selects with the arrow keys, wrapping at the ends', async () => {
    const group = await render(single);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(group.value).toBe('month');
    expect(document.activeElement).toBe(segments(group)[2]);
    await userEvent.keyboard('{ArrowRight}');
    expect(group.value).toBe('day');
    await userEvent.keyboard('{ArrowLeft}');
    expect(group.value).toBe('month');
    await userEvent.keyboard('{ArrowUp}');
    expect(group.value).toBe('week');
    await userEvent.keyboard('{ArrowDown}');
    expect(group.value).toBe('month');
  });

  it('swaps the horizontal arrows in a right-to-left row', async () => {
    const group = await render(single);
    group.dir = 'rtl';
    await userEvent.tab();
    await userEvent.keyboard('{ArrowLeft}');
    expect(group.value).toBe('month');
    await userEvent.keyboard('{ArrowRight}');
    expect(group.value).toBe('week');
  });

  it('moves the tab stop when the selected segment is disabled later', async () => {
    const group = await render(single);
    const [day, week] = segments(group);
    if (!day || !week) throw new Error('Missing segments');
    week.disabled = true;
    await week.updateComplete;
    await group.updateComplete;
    expect(segments(group).map((segment) => segment.tabbable)).toEqual([true, false, false]);
    await userEvent.tab();
    expect(document.activeElement).toBe(day);
  });

  it('follows a selected property set directly on a segment', async () => {
    const group = await render(single);
    const [day, week] = segments(group);
    if (!day || !week) throw new Error('Missing segments');
    day.selected = true;
    week.selected = false;
    await day.updateComplete;
    await group.updateComplete;
    expect(segments(group).map((segment) => segment.tabbable)).toEqual([true, false, false]);
  });

  it('jumps with Home and End and ignores other keys', async () => {
    const group = await render(single);
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    expect(group.value).toBe('month');
    await userEvent.keyboard('{Home}');
    expect(group.value).toBe('day');
    await userEvent.keyboard('a');
    expect(group.value).toBe('day');
  });

  it('skips disabled segments when moving', async () => {
    const group = await render(
      '<su3-segmented-button><su3-segment value="a" selected>A</su3-segment><su3-segment value="b" disabled>B</su3-segment><su3-segment value="c">C</su3-segment></su3-segmented-button>',
    );
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(group.value).toBe('c');
  });

  it('toggles with Space on the focused segment', async () => {
    const group = await render(single);
    segments(group)[0]?.focus();
    await userEvent.keyboard(' ');
    expect(group.value).toBe('day');
  });

  it('ignores disabled segments and a disabled group', async () => {
    const group = await render(
      '<su3-segmented-button><su3-segment value="a" selected>A</su3-segment><su3-segment value="b" disabled>B</su3-segment></su3-segmented-button>',
    );
    await expect.element(page.getByRole('radio', { name: 'B' })).toBeDisabled();
    segments(group)[1]?.click();
    expect(group.value).toBe('a');

    group.disabled = true;
    await group.updateComplete;
    await settle();
    await expect.element(page.getByRole('radio', { name: 'A' })).toBeDisabled();
    expect(group.getAttribute('disabled')).toBe('');
  });

  it('is disabled inside a disabled fieldset', async () => {
    document.body.innerHTML = `<fieldset disabled>${single}</fieldset>`;
    const group = document.querySelector('su3-segmented-button');
    await group?.updateComplete;
    await settle();
    await expect.element(page.getByRole('radio', { name: 'Week' })).toBeDisabled();
  });
});

describe('multiple selection', () => {
  it('is a group of toggle buttons with aria-pressed', async () => {
    await render(multiple);
    await expect.element(page.getByRole('group', { name: 'Filters' })).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Free' }))
      .toHaveAttribute('aria-pressed', 'true');
    await expect
      .element(page.getByRole('button', { name: 'Paid' }))
      .toHaveAttribute('aria-pressed', 'false');
  });

  it('reads values from the segments and toggles independently', async () => {
    const group = await render(multiple);
    expect(group.values).toEqual(['free', 'trial']);
    const events: string[] = [];
    group.addEventListener('change', () => events.push(group.values.join(',')));
    await userEvent.click(page.getByRole('button', { name: 'Paid' }));
    expect(group.values).toEqual(['free', 'paid', 'trial']);
    await userEvent.click(page.getByRole('button', { name: 'Free' }));
    expect(group.values).toEqual(['paid', 'trial']);
    expect(events).toEqual(['free,paid,trial', 'paid,trial']);
  });

  it('makes every segment a tab stop and ignores the arrow keys', async () => {
    const group = await render(multiple);
    expect(segments(group).every((segment) => segment.tabbable)).toBe(true);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(segments(group)[0]);
  });

  it('applies values set from outside', async () => {
    const group = await render(multiple);
    group.values = ['paid'];
    await group.updateComplete;
    expect(segments(group).map((segment) => segment.selected)).toEqual([false, true, false]);
  });

  it('switching to multiple keeps the selection', async () => {
    const group = await render(single);
    group.multiple = true;
    await group.updateComplete;
    await settle();
    expect(group.values).toEqual(['week']);
    await expect.element(page.getByRole('group')).toBeVisible();
  });
});

describe('inside a form', () => {
  async function renderForm(markup: string) {
    document.body.innerHTML = `<form>${markup}</form>`;
    const form = document.querySelector('form');
    const group = document.querySelector('su3-segmented-button');
    if (!form || !group) throw new Error('The form markup was not rendered');
    await group.updateComplete;
    await settle();
    await group.updateComplete;
    return { form, group };
  }

  it('submits name=value of the selected segment, nothing when none or unnamed', async () => {
    const { form, group } = await renderForm(single);
    expect(new FormData(form).get('range')).toBe('week');
    group.value = '';
    await group.updateComplete;
    expect(new FormData(form).has('range')).toBe(false);

    const unnamed = await renderForm(single.replace(' name="range"', ''));
    expect([...new FormData(unnamed.form).keys()]).toEqual([]);
  });

  it('submits one entry per selected segment in multiple mode', async () => {
    const { form, group } = await renderForm(multiple);
    expect(new FormData(form).getAll('f')).toEqual(['free', 'trial']);
    await userEvent.click(page.getByRole('button', { name: 'Trial' }));
    expect(new FormData(form).getAll('f')).toEqual(['free']);
    group.values = [];
    await group.updateComplete;
    expect(new FormData(form).has('f')).toBe(false);
    const unnamed = await renderForm(multiple.replace(' name="f"', ''));
    expect([...new FormData(unnamed.form).keys()]).toEqual([]);
  });

  it('is invalid while required and empty, then valid once chosen', async () => {
    const { form, group } = await renderForm(
      '<su3-segmented-button name="r" required aria-label="R"><su3-segment value="a">A</su3-segment><su3-segment value="b">B</su3-segment></su3-segmented-button>',
    );
    expect(group.validity.valueMissing).toBe(true);
    expect(group.validationMessage).toContain('select');
    expect(form.checkValidity()).toBe(false);
    await expect.element(page.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    await userEvent.click(page.getByRole('radio', { name: 'A' }));
    expect(group.validity.valid).toBe(true);
    expect(form.checkValidity()).toBe(true);
  });

  it('supports a custom validity message', async () => {
    const { group } = await renderForm(single);
    group.setCustomValidity('Not now');
    expect(group.validationMessage).toBe('Not now');
    group.setCustomValidity('');
    expect(group.validity.valid).toBe(true);
  });

  it('resets to the initial selection', async () => {
    const { form, group } = await renderForm(single);
    await userEvent.click(page.getByRole('radio', { name: 'Day' }));
    form.reset();
    await group.updateComplete;
    expect(group.value).toBe('week');
    expect(new FormData(form).get('range')).toBe('week');

    const multi = await renderForm(multiple);
    await userEvent.click(page.getByRole('button', { name: 'Paid' }));
    multi.form.reset();
    await multi.group.updateComplete;
    expect(multi.group.values).toEqual(['free', 'trial']);
  });

  it('restores a saved state', async () => {
    const { group } = await renderForm(single);
    group.formStateRestoreCallback('month', 'restore');
    await group.updateComplete;
    expect(group.value).toBe('month');
    group.formStateRestoreCallback('', 'restore');
    expect(group.value).toBe('');
    group.formStateRestoreCallback(null, 'restore');
    expect(group.value).toBe('');

    const multi = await renderForm(multiple);
    multi.group.formStateRestoreCallback('["paid"]', 'restore');
    await multi.group.updateComplete;
    expect(multi.group.values).toEqual(['paid']);
    multi.group.formStateRestoreCallback('not json', 'restore');
    multi.group.formStateRestoreCallback('{}', 'restore');
    expect(multi.group.values).toEqual(['paid']);
  });

  it('is not validated while disabled', async () => {
    const { group } = await renderForm(
      '<su3-segmented-button name="r" required disabled aria-label="R"><su3-segment value="a">A</su3-segment></su3-segmented-button>',
    );
    expect(group.willValidate).toBe(false);
  });
});

describe('dynamic segments', () => {
  it('positions and tab stops follow added and removed segments', async () => {
    const group = await render(single);
    const added = document.createElement('su3-segment');
    added.value = 'year';
    added.textContent = 'Year';
    group.append(added);
    await settle();
    await group.updateComplete;
    expect(segments(group).map((segment) => segment.position)).toEqual([
      'first',
      'middle',
      'middle',
      'last',
    ]);
    added.selected = true;
    await userEvent.click(page.getByRole('radio', { name: 'Day' }));
    expect(group.value).toBe('day');
    added.remove();
    await settle();
    await group.updateComplete;
    expect(segments(group)).toHaveLength(3);
  });
});

describe('appearance (built-in light values)', () => {
  const control = (segment: Su3Segment): HTMLElement => {
    const element = segment.shadowRoot?.querySelector<HTMLElement>('[part="control"]');
    if (!element) throw new Error('No control');
    return element;
  };

  it('shows the selected segment tinted with a check and the others outlined', async () => {
    const group = await render(single);
    const [day, week] = segments(group);
    if (!day || !week) throw new Error('Segments missing');
    expect(getComputedStyle(control(week)).backgroundColor).toBe('rgb(200, 244, 255)');
    expect(getComputedStyle(control(day)).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(control(day)).borderTopColor).toBe('rgb(128, 135, 140)');
    const check = (segment: Su3Segment): string => {
      const element = segment.shadowRoot?.querySelector('.check');
      if (!element) throw new Error('No check mark was rendered');
      return getComputedStyle(element).display;
    };
    expect(check(week)).not.toBe('none');
    expect(check(day)).toBe('none');
  });

  it('rounds only the outer corners', async () => {
    const group = await render(single);
    const [first, middle, last] = segments(group).map((segment) =>
      getComputedStyle(control(segment)),
    );
    expect(first?.borderTopLeftRadius).toBe('8px');
    expect(first?.borderTopRightRadius).toBe('0px');
    expect(middle?.borderTopLeftRadius).toBe('0px');
    expect(last?.borderTopRightRadius).toBe('8px');
  });

  it('follows the component hooks and the size', async () => {
    const group = await render(
      single.replace(
        '<su3-segmented-button',
        '<su3-segmented-button size="sm" style="--su3-comp-segmented-button-container-shape: 20px; --su3-comp-segmented-button-selected-container-color: rgb(1, 2, 3)"',
      ),
    );
    const [first, , last] = segments(group);
    const week = segments(group)[1];
    if (!first || !last || !week) throw new Error('Segments missing');
    expect(getComputedStyle(control(first)).borderTopLeftRadius).toBe('20px');
    expect(getComputedStyle(control(week)).backgroundColor).toBe('rgb(1, 2, 3)');
    expect(getComputedStyle(control(first)).height).toBe('32px');
  });

  it('shows a focus ring for keyboard focus', async () => {
    const group = await render(single);
    await userEvent.tab();
    const focused = segments(group)[1];
    if (!focused) throw new Error('No segment');
    expect(getComputedStyle(control(focused)).outlineStyle).toBe('solid');
  });
});
