import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './index.ts';
import type { Su3TextField } from './text-field.ts';

async function render(markup: string): Promise<Su3TextField> {
  document.body.innerHTML = markup;
  const fields = [...document.querySelectorAll('su3-text-field')];
  await Promise.all(fields.map((field) => field.updateComplete));
  const first = fields[0];
  if (!first) throw new Error('No su3-text-field was rendered');
  return first;
}

const part = (host: Su3TextField, name: string): HTMLElement => {
  const element = host.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`);
  if (!element) throw new Error(`The ${name} part was not rendered`);
  return element;
};

const input = (host: Su3TextField): HTMLInputElement => part(host, 'input') as HTMLInputElement;
const style = (host: Su3TextField, name = 'container') => getComputedStyle(part(host, name));
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('rendering and accessibility', () => {
  it('exposes a textbox named by its label', async () => {
    await render('<su3-text-field label="Name"></su3-text-field>');
    await expect.element(page.getByRole('textbox', { name: 'Name' })).toBeVisible();
  });

  it('uses aria-label when there is no visible label', async () => {
    const host = await render('<su3-text-field aria-label="Search"></su3-text-field>');
    await expect.element(page.getByRole('textbox', { name: 'Search' })).toBeVisible();
    expect(part(host, 'label').hidden).toBe(true);
  });

  it('marks a required field visually and for assistive technology', async () => {
    const host = await render('<su3-text-field label="Name" required></su3-text-field>');
    expect(part(host, 'label').textContent).toContain('*');
    expect(input(host).required).toBe(true);
  });

  it('passes the input attributes through', async () => {
    const host = await render(
      '<su3-text-field label="Code" type="tel" placeholder="000" minlength="2" maxlength="6" pattern="[0-9]+" autocomplete="one-time-code" inputmode="numeric" readonly></su3-text-field>',
    );
    const native = input(host);
    expect(native.type).toBe('tel');
    expect(native.placeholder).toBe('000');
    expect(native.minLength).toBe(2);
    expect(native.maxLength).toBe(6);
    expect(native.pattern).toBe('[0-9]+');
    expect(native.getAttribute('autocomplete')).toBe('one-time-code');
    expect(native.inputMode).toBe('numeric');
    expect(native.readOnly).toBe(true);
  });

  it('reflects variant, type, readonly and required as attributes', async () => {
    const host = await render('<su3-text-field label="Name"></su3-text-field>');
    host.variant = 'filled';
    host.type = 'email';
    host.readonly = true;
    host.required = true;
    await host.updateComplete;
    expect(host.getAttribute('variant')).toBe('filled');
    expect(host.getAttribute('type')).toBe('email');
    expect(host.hasAttribute('readonly')).toBe(true);
    expect(host.hasAttribute('required')).toBe(true);
  });

  it('shows supporting text and links it to the input', async () => {
    const host = await render(
      '<su3-text-field label="Name" supporting-text="As on your card"></su3-text-field>',
    );
    await expect.element(page.getByRole('textbox')).toHaveAccessibleDescription('As on your card');
    expect(part(host, 'supporting-text').hidden).toBe(false);
  });

  it('hides the supporting line when there is no text', async () => {
    const host = await render('<su3-text-field label="Name"></su3-text-field>');
    expect(part(host, 'supporting-text').hidden).toBe(true);
    expect(input(host).hasAttribute('aria-describedby')).toBe(false);
  });

  it('offers leading and trailing slots', async () => {
    const host = await render(
      '<su3-text-field label="Search"><span slot="leading">L</span><span slot="trailing">T</span></su3-text-field>',
    );
    const slots = [...(host.shadowRoot?.querySelectorAll('slot') ?? [])].map((slot) => slot.name);
    expect(slots).toEqual(['leading', 'trailing']);
  });
});

describe('value and events', () => {
  it('shows the value attribute and follows the value property', async () => {
    const host = await render('<su3-text-field label="Name" value="Ada"></su3-text-field>');
    expect(input(host).value).toBe('Ada');
    host.value = 'Grace';
    await host.updateComplete;
    expect(input(host).value).toBe('Grace');
  });

  it('updates value as the user types and fires input then change', async () => {
    const host = await render('<su3-text-field label="Name"></su3-text-field>');
    const events: string[] = [];
    host.addEventListener('input', () => events.push(`input:${host.value}`));
    host.addEventListener('change', () => events.push(`change:${host.value}`));
    const textbox = page.getByRole('textbox', { name: 'Name' });
    await userEvent.fill(textbox, 'Ada');
    expect(host.value).toBe('Ada');
    await userEvent.tab();
    expect(events.at(-1)).toBe('change:Ada');
    expect(events.filter((event) => event.startsWith('input')).length).toBeGreaterThan(0);
  });

  it('takes focus from host.focus() and with Tab, and shows a focus ring', async () => {
    const host = await render('<su3-text-field label="Name"></su3-text-field>');
    expect(style(host).outlineStyle).toBe('none');
    host.focus();
    expect(host.shadowRoot?.activeElement).toBe(input(host));
    expect(style(host).outlineStyle).toBe('solid');
    expect(style(host).outlineColor).toBe('rgb(0, 150, 175)');
  });

  it('selects its value', async () => {
    const host = await render(
      '<su3-text-field label="Name" value="Ada Lovelace"></su3-text-field>',
    );
    host.focus();
    host.select();
    expect(input(host).selectionStart).toBe(0);
    expect(input(host).selectionEnd).toBe(12);
  });

  it('cannot be edited when read only or disabled', async () => {
    const readonly = await render(
      '<su3-text-field label="Name" value="Ada" readonly></su3-text-field>',
    );
    expect(input(readonly).readOnly).toBe(true);
    const disabled = await render('<su3-text-field label="Name" disabled></su3-text-field>');
    await expect.element(page.getByRole('textbox')).toBeDisabled();
    expect(disabled.willValidate).toBe(false);
  });

  it('is disabled inside a disabled fieldset', async () => {
    await render('<fieldset disabled><su3-text-field label="Name"></su3-text-field></fieldset>');
    await expect.element(page.getByRole('textbox')).toBeDisabled();
  });
});

describe('validation', () => {
  it('is invalid when a required field is empty and valid once it has a value', async () => {
    const host = await render('<su3-text-field label="Name" name="n" required></su3-text-field>');
    expect(host.validity.valueMissing).toBe(true);
    expect(host.checkValidity()).toBe(false);
    host.value = 'Ada';
    await host.updateComplete;
    expect(host.validity.valid).toBe(true);
  });

  it('checks type, pattern and length constraints like a native input', async () => {
    const email = await render(
      '<su3-text-field label="Email" type="email" value="nope"></su3-text-field>',
    );
    expect(email.validity.typeMismatch).toBe(true);
    email.value = 'a@b.co';
    await email.updateComplete;
    expect(email.validity.valid).toBe(true);

    const pattern = await render(
      '<su3-text-field label="Code" pattern="[0-9]+" value="abc"></su3-text-field>',
    );
    expect(pattern.validity.patternMismatch).toBe(true);

    const short = await render('<su3-text-field label="Name" minlength="3"></su3-text-field>');
    await userEvent.fill(page.getByRole('textbox'), 'ab');
    expect(short.validity.tooShort).toBe(true);
  });

  it('shows no error before the field is touched, then shows the browser message', async () => {
    const host = await render('<su3-text-field label="Name" required></su3-text-field>');
    expect(part(host, 'supporting-text').hidden).toBe(true);
    expect(input(host).getAttribute('aria-invalid')).toBeNull();

    await userEvent.click(page.getByRole('textbox'));
    await userEvent.tab();
    await host.updateComplete;
    expect(part(host, 'supporting-text').hidden).toBe(false);
    expect(part(host, 'supporting-text').textContent.trim()).toBe(host.validationMessage);
    expect(input(host).getAttribute('aria-invalid')).toBe('true');
    await expect
      .element(page.getByRole('textbox'))
      .toHaveAccessibleDescription(host.validationMessage);
  });

  it('shows the error immediately when error-text is set, in the error color', async () => {
    const host = await render(
      '<su3-text-field label="Code" error-text="Enter a valid code"></su3-text-field>',
    );
    expect(part(host, 'supporting-text').textContent.trim()).toBe('Enter a valid code');
    expect(input(host).getAttribute('aria-invalid')).toBe('true');
    expect(style(host).borderTopColor).toBe('rgb(165, 30, 36)');
  });

  it('reports a failed submit as touched so the error appears', async () => {
    document.body.innerHTML =
      '<form><su3-text-field label="Name" name="n" required></su3-text-field></form>';
    const host = document.querySelector('su3-text-field') as Su3TextField;
    await host.updateComplete;
    (document.querySelector('form') as HTMLFormElement).requestSubmit();
    await settle();
    await host.updateComplete;
    expect(host.touched).toBe(true);
    expect(part(host, 'supporting-text').hidden).toBe(false);
  });

  it('supports a custom validity message', async () => {
    const host = await render('<su3-text-field label="Name" value="Ada"></su3-text-field>');
    host.setCustomValidity('Taken');
    expect(host.validationMessage).toBe('Taken');
    expect(host.checkValidity()).toBe(false);
    host.setCustomValidity('');
    expect(host.validity.valid).toBe(true);
  });
});

describe('inside a form', () => {
  async function renderForm(markup: string) {
    document.body.innerHTML = `<form>${markup}</form>`;
    const form = document.querySelector('form');
    const host = document.querySelector('su3-text-field');
    if (!form || !host) throw new Error('Fixture was not rendered');
    await host.updateComplete;
    return { form, host };
  }

  it('submits its value under its name', async () => {
    const { form, host } = await renderForm(
      '<su3-text-field name="name" label="Name" value="Ada"></su3-text-field>',
    );
    expect(new FormData(form).get('name')).toBe('Ada');
    await userEvent.fill(page.getByRole('textbox'), 'Grace');
    expect(new FormData(form).get('name')).toBe('Grace');
    host.value = 'Katherine';
    await host.updateComplete;
    expect(new FormData(form).get('name')).toBe('Katherine');
  });

  it('is left out of the form data while disabled', async () => {
    const { form } = await renderForm(
      '<su3-text-field name="name" label="Name" value="Ada" disabled></su3-text-field>',
    );
    expect(new FormData(form).has('name')).toBe(false);
  });

  it('resets to its value attribute and clears the touched state', async () => {
    const { form, host } = await renderForm(
      '<su3-text-field name="n" label="Name" value="Ada"></su3-text-field>',
    );
    await userEvent.fill(page.getByRole('textbox'), 'Changed');
    await userEvent.tab();
    expect(host.touched).toBe(true);
    form.reset();
    await host.updateComplete;
    expect(host.value).toBe('Ada');
    expect(input(host).value).toBe('Ada');
    expect(host.touched).toBe(false);
  });

  it('restores a saved value', async () => {
    const { host } = await renderForm('<su3-text-field name="n" label="Name"></su3-text-field>');
    host.formStateRestoreCallback('Saved', 'restore');
    await host.updateComplete;
    expect(host.value).toBe('Saved');
    host.formStateRestoreCallback(null, 'restore');
    expect(host.value).toBe('Saved');
  });

  it('blocks a submit with an invalid field', async () => {
    const { form } = await renderForm(
      '<su3-text-field name="n" label="Name" required></su3-text-field>',
    );
    let submitted = 0;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted += 1;
    });
    form.requestSubmit();
    expect(submitted).toBe(0);
    await userEvent.fill(page.getByRole('textbox'), 'Ada');
    form.requestSubmit();
    expect(submitted).toBe(1);
  });
});

describe('appearance (built-in light values)', () => {
  it('draws a 48px outlined container with a visible border', async () => {
    const host = await render('<su3-text-field label="Name"></su3-text-field>');
    expect(style(host).height).toBe('48px');
    expect(style(host).borderTopColor).toBe('rgb(128, 135, 140)');
    expect(style(host).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(style(host).borderTopLeftRadius).toBe('4px');
  });

  it('fills the filled variant and removes its top and side borders', async () => {
    const host = await render('<su3-text-field variant="filled" label="Name"></su3-text-field>');
    expect(style(host).backgroundColor).toBe('rgb(236, 245, 251)');
    expect(style(host).borderTopColor).toBe('rgba(0, 0, 0, 0)');
    expect(style(host).borderBottomColor).toBe('rgb(128, 135, 140)');
    expect(style(host).borderBottomLeftRadius).toBe('0px');
  });

  it('mutes a disabled field', async () => {
    const enabled = await render('<su3-text-field label="Name" value="x"></su3-text-field>');
    const color = style(enabled).color;
    const disabled = await render(
      '<su3-text-field label="Name" value="x" disabled></su3-text-field>',
    );
    expect(style(disabled).color).not.toBe(color);
  });

  it('follows component hooks', async () => {
    const host = await render(
      '<su3-text-field label="Name" style="--su3-comp-text-field-container-shape: 24px; --su3-comp-text-field-height: 64px"></su3-text-field>',
    );
    expect(style(host).borderTopLeftRadius).toBe('24px');
    expect(style(host).height).toBe('64px');
  });
});
