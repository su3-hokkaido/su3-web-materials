import { html, type TemplateResult } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FormAssociatedElement,
  type FormRestoreState,
  type FormStateRestoreMode,
} from './form-associated.ts';

/** Minimal control: valid unless `value` is empty and `data-required` is set (a stand-in constraint). */
class TestControl extends FormAssociatedElement {
  resets = 0;
  restored: [FormRestoreState, FormStateRestoreMode][] = [];

  protected override render(): TemplateResult {
    return html`<input />`;
  }

  protected override revalidate(): void {
    const missing = this.hasAttribute('data-required') && this.value === '';
    this.setValidityState({ valueMissing: missing }, missing ? 'Required' : '');
  }

  protected override updated(): void {
    this.revalidate();
  }

  protected override resetFormState(): void {
    this.resets += 1;
    this.value = '';
  }

  protected override restoreFormState(state: FormRestoreState, mode: FormStateRestoreMode): void {
    this.restored.push([state, mode]);
  }
}
customElements.define('su3-test-control', TestControl);

declare global {
  interface HTMLElementTagNameMap {
    'su3-test-control': TestControl;
  }
}

async function render(markup: string): Promise<{ form: HTMLFormElement; control: TestControl }> {
  document.body.innerHTML = `<form>${markup}</form>`;
  const form = document.querySelector('form');
  const control = document.querySelector('su3-test-control');
  if (!form || !control) throw new Error('Fixture was not rendered');
  await control.updateComplete;
  return { form, control };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('validity API', () => {
  it('is valid by default and exposes the native members', async () => {
    const { control } = await render('<su3-test-control name="a"></su3-test-control>');
    expect(control.validity.valid).toBe(true);
    expect(control.validationMessage).toBe('');
    expect(control.willValidate).toBe(true);
    expect(control.checkValidity()).toBe(true);
    expect(control.reportValidity()).toBe(true);
  });

  it('reports a custom error and fires invalid, then recovers when it is cleared', async () => {
    const { form, control } = await render('<su3-test-control></su3-test-control>');
    let invalid = 0;
    control.addEventListener('invalid', () => {
      invalid += 1;
    });

    control.setCustomValidity('Not good');
    expect(control.validity.customError).toBe(true);
    expect(control.validationMessage).toBe('Not good');
    expect(control.checkValidity()).toBe(false);
    expect(form.checkValidity()).toBe(false);
    expect(invalid).toBeGreaterThan(0);

    control.setCustomValidity('');
    expect(control.validity.valid).toBe(true);
    expect(form.checkValidity()).toBe(true);
  });

  it('lets a subclass constraint produce a flag and message, with a custom error taking priority', async () => {
    const { control } = await render('<su3-test-control data-required></su3-test-control>');
    expect(control.validity.valueMissing).toBe(true);
    expect(control.validationMessage).toBe('Required');

    control.setCustomValidity('Custom');
    expect(control.validationMessage).toBe('Custom');
    expect(control.validity.customError).toBe(true);

    control.setCustomValidity('');
    expect(control.validationMessage).toBe('Required');

    control.value = 'x';
    await control.updateComplete;
    expect(control.validity.valid).toBe(true);
  });

  it('is exempt from validation while disabled', async () => {
    const { control } = await render('<su3-test-control disabled></su3-test-control>');
    expect(control.willValidate).toBe(false);
  });

  it('knows its labels', async () => {
    document.body.innerHTML =
      '<form><label for="c">Name</label><su3-test-control id="c"></su3-test-control></form>';
    const control = document.querySelector('su3-test-control');
    await control?.updateComplete;
    expect(control?.labels).toHaveLength(1);
  });
});

describe('form callbacks', () => {
  it('calls resetFormState when the form resets', async () => {
    const { form, control } = await render('<su3-test-control value="a"></su3-test-control>');
    control.value = 'changed';
    form.reset();
    expect(control.resets).toBe(1);
    expect(control.value).toBe('');
  });

  it('passes the saved state and mode to restoreFormState', async () => {
    const { control } = await render('<su3-test-control></su3-test-control>');
    control.formStateRestoreCallback('saved', 'restore');
    control.formStateRestoreCallback(null, 'autocomplete');
    expect(control.restored).toEqual([
      ['saved', 'restore'],
      [null, 'autocomplete'],
    ]);
  });

  it('tracks the disabled state of a fieldset', async () => {
    document.body.innerHTML =
      '<form><fieldset disabled><su3-test-control></su3-test-control></fieldset></form>';
    const control = document.querySelector('su3-test-control');
    await control?.updateComplete;
    expect(control?.willValidate).toBe(false);
  });
});

describe('accessibleName', () => {
  it('reads aria-label and follows changes', async () => {
    const { control } = await render('<su3-test-control aria-label="Quantity"></su3-test-control>');
    expect(control.accessibleName).toBe('Quantity');
    control.setAttribute('aria-label', 'Amount');
    expect(control.accessibleName).toBe('Amount');
    control.removeAttribute('aria-label');
    expect(control.accessibleName).toBeNull();
  });
});

describe('the default hooks', () => {
  class Plain extends FormAssociatedElement {}
  customElements.define('su3-test-plain', Plain);

  it('do nothing and leave the control valid', async () => {
    document.body.innerHTML = '<form><su3-test-plain></su3-test-plain></form>';
    const plain = document.querySelector('su3-test-plain') as Plain;
    await plain.updateComplete;
    expect(() => {
      plain.formResetCallback();
      plain.formStateRestoreCallback('x', 'restore');
    }).not.toThrow();
    expect(plain.checkValidity()).toBe(true);
    plain.setCustomValidity('x');
    expect(plain.checkValidity()).toBe(false);
  });
});
