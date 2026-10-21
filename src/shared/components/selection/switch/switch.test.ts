import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './index.ts';
import type { Su3Switch } from './switch.ts';

async function render(markup: string): Promise<Su3Switch> {
  document.body.innerHTML = markup;
  const switches = [...document.querySelectorAll('su3-switch')];
  await Promise.all(switches.map((control) => control.updateComplete));
  const first = switches[0];
  if (!first) throw new Error('No su3-switch was rendered');
  return first;
}

const part = (host: Su3Switch, name: string): HTMLElement => {
  const element = host.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`);
  if (!element) throw new Error(`The ${name} part was not rendered`);
  return element;
};

const style = (host: Su3Switch, name = 'track') => getComputedStyle(part(host, name));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('rendering and accessibility', () => {
  it('exposes a switch named by its label, off by default', async () => {
    await render('<su3-switch>Notifications</su3-switch>');
    const control = page.getByRole('switch', { name: 'Notifications' });
    await expect.element(control).toBeVisible();
    await expect.element(control).not.toBeChecked();
  });

  it('starts from the checked attribute', async () => {
    const host = await render('<su3-switch checked>Notifications</su3-switch>');
    expect(host.checked).toBe(true);
    await expect.element(page.getByRole('switch')).toBeChecked();
  });

  it('uses aria-label when there is no label text, and announces required', async () => {
    const host = await render('<su3-switch aria-label="Dark mode" required></su3-switch>');
    const control = page.getByRole('switch', { name: 'Dark mode' });
    await expect.element(control).toHaveAttribute('aria-required', 'true');
    expect(part(host, 'label').hidden).toBe(true);
  });

  it('reflects required and disabled', async () => {
    const host = await render('<su3-switch>Notifications</su3-switch>');
    host.required = true;
    host.disabled = true;
    await host.updateComplete;
    expect(host.hasAttribute('required')).toBe(true);
    expect(host.hasAttribute('disabled')).toBe(true);
  });
});

describe('interaction', () => {
  it('toggles on click and on the label', async () => {
    const host = await render('<su3-switch>Notifications</su3-switch>');
    await userEvent.click(page.getByRole('switch'));
    expect(host.checked).toBe(true);
    part(host, 'label').click();
    await host.updateComplete;
    expect(host.checked).toBe(false);
  });

  it('takes focus with Tab and toggles on Space', async () => {
    const host = await render('<su3-switch>Notifications</su3-switch>');
    await userEvent.tab();
    expect(host.matches(':focus')).toBe(true);
    await userEvent.keyboard(' ');
    expect(host.checked).toBe(true);
    expect(style(host).outlineStyle).toBe('solid');
  });

  it('fires input then change once each, with checked already updated', async () => {
    const host = await render('<su3-switch>Notifications</su3-switch>');
    const events: string[] = [];
    host.addEventListener('input', () => events.push(`input:${String(host.checked)}`));
    host.addEventListener('change', () => events.push(`change:${String(host.checked)}`));
    await userEvent.click(page.getByRole('switch'));
    expect(events).toEqual(['input:true', 'change:true']);
  });

  it('ignores the user when disabled, including inside a disabled fieldset', async () => {
    const host = await render('<su3-switch disabled>Notifications</su3-switch>');
    await expect.element(page.getByRole('switch')).toBeDisabled();
    part(host, 'input').click();
    expect(host.checked).toBe(false);

    await render('<fieldset disabled><su3-switch>Notifications</su3-switch></fieldset>');
    await expect.element(page.getByRole('switch')).toBeDisabled();
  });
});

describe('appearance (built-in light values)', () => {
  it('draws a 44 by 24 track with an outline when off', async () => {
    const host = await render('<su3-switch>Notifications</su3-switch>');
    expect(style(host).width).toBe('44px');
    expect(style(host).height).toBe('24px');
    expect(style(host).borderTopColor).toBe('rgb(128, 135, 140)');
    expect(style(host).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(style(host, 'thumb').width).toBe('16px');
  });

  it('fills the track with the accent and moves the thumb to the far end when on', async () => {
    const off = await render('<su3-switch>Notifications</su3-switch>');
    const offLeft =
      part(off, 'thumb').getBoundingClientRect().left -
      part(off, 'track').getBoundingClientRect().left;

    const on = await render('<su3-switch checked>Notifications</su3-switch>');
    expect(style(on).backgroundColor).toBe('rgb(0, 96, 113)');
    const track = part(on, 'track').getBoundingClientRect();
    const thumb = part(on, 'thumb').getBoundingClientRect();
    // The thumb has the same gap to the track's right edge as it had to the left edge when off.
    expect(track.right - thumb.right).toBeCloseTo(offLeft, 0);
  });

  it('mutes a disabled switch', async () => {
    const enabled = await render('<su3-switch checked>Notifications</su3-switch>');
    const fill = style(enabled).backgroundColor;
    const disabled = await render('<su3-switch checked disabled>Notifications</su3-switch>');
    expect(style(disabled).backgroundColor).not.toBe(fill);
  });

  it('follows component hooks', async () => {
    const host = await render(
      '<su3-switch checked style="--su3-comp-switch-track-width: 60px; --su3-comp-switch-selected-track-color: rgb(1, 2, 3)">Notifications</su3-switch>',
    );
    expect(style(host).width).toBe('60px');
    expect(style(host).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('shows a state layer on the thumb on hover', async () => {
    const host = await render('<su3-switch>Notifications</su3-switch>');
    const layer = () => Number(getComputedStyle(part(host, 'thumb'), '::before').opacity);
    expect(layer()).toBe(0);
    await userEvent.hover(page.getByRole('switch'));
    await expect.poll(layer).toBeCloseTo(0.08, 2);
  });
});

describe('inside a form', () => {
  async function renderForm(controlMarkup: string) {
    document.body.innerHTML = `<form>${controlMarkup}</form>`;
    const form = document.querySelector('form');
    const host = document.querySelector('su3-switch');
    if (!form || !host) throw new Error('Fixture was not rendered');
    await host.updateComplete;
    return { form, host };
  }

  it('submits name=value only while on, with on as the default value', async () => {
    const { form, host } = await renderForm('<su3-switch name="email">Email</su3-switch>');
    expect(new FormData(form).has('email')).toBe(false);
    host.checked = true;
    await host.updateComplete;
    expect(new FormData(form).get('email')).toBe('on');
    host.value = 'yes';
    await host.updateComplete;
    expect(new FormData(form).get('email')).toBe('yes');
  });

  it('is invalid while required and off, with a switch-specific message', async () => {
    const { form, host } = await renderForm('<su3-switch name="t" required>Agree</su3-switch>');
    expect(host.validity.valueMissing).toBe(true);
    expect(host.validationMessage).toBe('Please turn this switch on to proceed.');
    expect(form.checkValidity()).toBe(false);
    await userEvent.click(page.getByRole('switch'));
    expect(form.checkValidity()).toBe(true);
  });

  it('resets to its checked attribute and restores a saved state', async () => {
    const { form, host } = await renderForm('<su3-switch name="a" checked>Email</su3-switch>');
    await userEvent.click(page.getByRole('switch'));
    expect(host.checked).toBe(false);
    form.reset();
    await host.updateComplete;
    expect(host.checked).toBe(true);

    host.formStateRestoreCallback('unchecked', 'restore');
    await host.updateComplete;
    expect(host.checked).toBe(false);
  });

  it('is not submitted while disabled', async () => {
    const { form } = await renderForm('<su3-switch name="a" checked disabled>Email</su3-switch>');
    expect(new FormData(form).has('a')).toBe(false);
  });
});
