import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './index.ts';
import type { Su3Checkbox } from './checkbox.ts';

async function render(markup: string): Promise<Su3Checkbox> {
  document.body.innerHTML = markup;
  const boxes = [...document.querySelectorAll('su3-checkbox')];
  await Promise.all(boxes.map((box) => box.updateComplete));
  const first = boxes[0];
  if (!first) throw new Error('No su3-checkbox was rendered');
  return first;
}

const part = (host: Su3Checkbox, name: string): HTMLElement => {
  const element = host.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`);
  if (!element) throw new Error(`The ${name} part was not rendered`);
  return element;
};

const style = (host: Su3Checkbox, name = 'box') => getComputedStyle(part(host, name));
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('rendering and accessibility', () => {
  it('exposes a checkbox named by its label', async () => {
    await render('<su3-checkbox>Accept</su3-checkbox>');
    const checkbox = page.getByRole('checkbox', { name: 'Accept' });
    await expect.element(checkbox).toBeVisible();
    await expect.element(checkbox).not.toBeChecked();
  });

  it('uses aria-label from the host when there is no label text', async () => {
    const host = await render('<su3-checkbox aria-label="Select row"></su3-checkbox>');
    await expect.element(page.getByRole('checkbox', { name: 'Select row' })).toBeVisible();
    expect(part(host, 'label').hidden).toBe(true);
  });

  it('starts from the checked attribute and keeps it out of the reflected attributes', async () => {
    const host = await render('<su3-checkbox checked>Accept</su3-checkbox>');
    expect(host.checked).toBe(true);
    await expect.element(page.getByRole('checkbox')).toBeChecked();
    host.checked = false;
    await host.updateComplete;
    expect(host.hasAttribute('checked')).toBe(true);
  });

  it('announces an indeterminate checkbox as mixed and a required one as required', async () => {
    await render('<su3-checkbox indeterminate required>Accept</su3-checkbox>');
    const checkbox = page.getByRole('checkbox');
    await expect.element(checkbox).toBePartiallyChecked();
    await expect.element(checkbox).toHaveAttribute('aria-required', 'true');
  });

  it('reflects indeterminate, required and disabled as attributes', async () => {
    const host = await render('<su3-checkbox>Accept</su3-checkbox>');
    host.indeterminate = true;
    host.required = true;
    host.disabled = true;
    await host.updateComplete;
    for (const name of ['indeterminate', 'required', 'disabled']) {
      expect(host.hasAttribute(name), name).toBe(true);
    }
  });

  it('shows the label when content is added later', async () => {
    const host = await render('<su3-checkbox aria-label="x"></su3-checkbox>');
    expect(part(host, 'label').hidden).toBe(true);
    host.append('Added');
    await settle();
    await host.updateComplete;
    expect(part(host, 'label').hidden).toBe(false);
  });
});

describe('interaction', () => {
  it('toggles on click', async () => {
    const host = await render('<su3-checkbox>Accept</su3-checkbox>');
    const checkbox = page.getByRole('checkbox', { name: 'Accept' });
    await userEvent.click(checkbox);
    expect(host.checked).toBe(true);
    await userEvent.click(checkbox);
    expect(host.checked).toBe(false);
  });

  it('takes focus with Tab, toggles on Space and gives focus back to host.focus()', async () => {
    const host = await render('<su3-checkbox>Accept</su3-checkbox>');
    await userEvent.tab();
    expect(host.matches(':focus')).toBe(true);
    await userEvent.keyboard(' ');
    expect(host.checked).toBe(true);

    host.blur();
    expect(host.matches(':focus')).toBe(false);
    host.focus();
    expect(host.matches(':focus')).toBe(true);
  });

  it('toggles when the label text is clicked', async () => {
    const host = await render('<su3-checkbox>Accept</su3-checkbox>');
    part(host, 'label').click();
    await host.updateComplete;
    expect(host.checked).toBe(true);
  });

  it('fires input then change once each, with checked already updated in input', async () => {
    const host = await render('<su3-checkbox>Accept</su3-checkbox>');
    const events: string[] = [];
    host.addEventListener('input', () => events.push(`input:${String(host.checked)}`));
    host.addEventListener('change', () => events.push(`change:${String(host.checked)}`));
    await userEvent.click(page.getByRole('checkbox'));
    expect(events).toEqual(['input:true', 'change:true']);
  });

  it('clears indeterminate when the user toggles it', async () => {
    const host = await render('<su3-checkbox indeterminate>Accept</su3-checkbox>');
    await userEvent.click(page.getByRole('checkbox'));
    await host.updateComplete;
    expect(host.indeterminate).toBe(false);
    expect(host.hasAttribute('indeterminate')).toBe(false);
    expect(host.checked).toBe(true);
  });

  it('ignores the user when disabled, including inside a disabled fieldset', async () => {
    const host = await render('<su3-checkbox disabled>Accept</su3-checkbox>');
    await expect.element(page.getByRole('checkbox')).toBeDisabled();
    part(host, 'input').click();
    expect(host.checked).toBe(false);

    await render('<fieldset disabled><su3-checkbox>Accept</su3-checkbox></fieldset>');
    await expect.element(page.getByRole('checkbox')).toBeDisabled();
  });

  it('shows a focus ring for keyboard focus only', async () => {
    const host = await render('<su3-checkbox>Accept</su3-checkbox>');
    expect(style(host).outlineStyle).toBe('none');
    await userEvent.tab();
    expect(style(host).outlineStyle).toBe('solid');
    expect(style(host).outlineColor).toBe('rgb(0, 150, 175)');
  });
});

describe('appearance (built-in light values)', () => {
  it('draws a 20px box with a visible border when unchecked', async () => {
    const host = await render('<su3-checkbox>Accept</su3-checkbox>');
    expect(style(host).width).toBe('20px');
    expect(style(host).height).toBe('20px');
    expect(style(host).borderTopColor).toBe('rgb(128, 135, 140)');
    expect(style(host).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('fills the box with the accent when checked or indeterminate', async () => {
    const checked = await render('<su3-checkbox checked>Accept</su3-checkbox>');
    expect(style(checked).backgroundColor).toBe('rgb(0, 96, 113)');
    const indeterminate = await render('<su3-checkbox indeterminate>Accept</su3-checkbox>');
    expect(style(indeterminate).backgroundColor).toBe('rgb(0, 96, 113)');
  });

  it('mutes a disabled checkbox', async () => {
    const enabled = await render('<su3-checkbox checked>Accept</su3-checkbox>');
    const enabledFill = style(enabled).backgroundColor;
    const disabled = await render('<su3-checkbox checked disabled>Accept</su3-checkbox>');
    expect(style(disabled).backgroundColor).not.toBe(enabledFill);
  });

  it('follows component hooks', async () => {
    const host = await render(
      '<su3-checkbox checked style="--su3-comp-checkbox-size: 32px; --su3-comp-checkbox-selected-container-color: rgb(1, 2, 3)">Accept</su3-checkbox>',
    );
    expect(style(host).width).toBe('32px');
    expect(style(host).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('shows a state layer on hover', async () => {
    const host = await render('<su3-checkbox>Accept</su3-checkbox>');
    const layer = () => Number(getComputedStyle(part(host, 'box'), '::before').opacity);
    expect(layer()).toBe(0);
    await userEvent.hover(page.getByRole('checkbox'));
    await expect.poll(layer).toBeCloseTo(0.08, 2);
  });
});

describe('inside a form', () => {
  async function renderForm(controlMarkup: string) {
    document.body.innerHTML = `<form>${controlMarkup}</form>`;
    const form = document.querySelector('form');
    const host = document.querySelector('su3-checkbox');
    if (!form || !host) throw new Error('Fixture was not rendered');
    await host.updateComplete;
    return { form, host };
  }

  it('submits name=value only while checked, with on as the default value', async () => {
    const { form, host } = await renderForm('<su3-checkbox name="terms">Accept</su3-checkbox>');
    expect(new FormData(form).has('terms')).toBe(false);
    host.checked = true;
    await host.updateComplete;
    expect(new FormData(form).get('terms')).toBe('on');
    host.value = 'accepted';
    await host.updateComplete;
    expect(new FormData(form).get('terms')).toBe('accepted');
  });

  it('is invalid while required and unchecked, with a message and the invalid event', async () => {
    const { form, host } = await renderForm(
      '<su3-checkbox name="t" required>Accept</su3-checkbox>',
    );
    expect(host.validity.valueMissing).toBe(true);
    expect(host.validationMessage).toContain('check this box');
    expect(form.checkValidity()).toBe(false);

    let invalid = 0;
    host.addEventListener('invalid', () => {
      invalid += 1;
    });
    form.requestSubmit();
    expect(invalid).toBe(1);

    await userEvent.click(page.getByRole('checkbox'));
    expect(host.validity.valid).toBe(true);
    expect(form.checkValidity()).toBe(true);
  });

  it('supports a custom validity message', async () => {
    const { host } = await renderForm('<su3-checkbox name="t">Accept</su3-checkbox>');
    host.setCustomValidity('Not now');
    expect(host.validationMessage).toBe('Not now');
    host.setCustomValidity('');
    expect(host.validity.valid).toBe(true);
  });

  it('resets to its checked attribute', async () => {
    const { form, host } = await renderForm('<su3-checkbox name="a" checked>Accept</su3-checkbox>');
    await userEvent.click(page.getByRole('checkbox'));
    expect(host.checked).toBe(false);
    form.reset();
    await host.updateComplete;
    expect(host.checked).toBe(true);

    const { form: form2, host: host2 } = await renderForm(
      '<su3-checkbox name="b">Accept</su3-checkbox>',
    );
    host2.checked = true;
    form2.reset();
    await host2.updateComplete;
    expect(host2.checked).toBe(false);
  });

  it('restores a saved state', async () => {
    const { host } = await renderForm('<su3-checkbox name="a">Accept</su3-checkbox>');
    host.formStateRestoreCallback('checked', 'restore');
    await host.updateComplete;
    expect(host.checked).toBe(true);
    host.formStateRestoreCallback('unchecked', 'restore');
    await host.updateComplete;
    expect(host.checked).toBe(false);
    host.formStateRestoreCallback('checked', 'autocomplete');
    expect(host.checked).toBe(true);
  });

  it('is not submitted and not validated while disabled', async () => {
    const { form, host } = await renderForm(
      '<su3-checkbox name="a" checked required disabled>Accept</su3-checkbox>',
    );
    expect(new FormData(form).has('a')).toBe(false);
    expect(host.willValidate).toBe(false);
  });
});
