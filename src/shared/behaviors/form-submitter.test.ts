import { html, type TemplateResult } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { FormSubmitterElement } from './form-submitter.ts';

/** Minimal concrete element: a native button wired to the behavior under test. */
class TestSubmitter extends FormSubmitterElement {
  protected override render(): TemplateResult {
    return html`<button ?disabled=${this.isDisabled}><slot></slot></button>`;
  }
}
customElements.define('su3-test-submitter', TestSubmitter);

declare global {
  interface HTMLElementTagNameMap {
    'su3-test-submitter': TestSubmitter;
  }
}

/**
 * Dispatches a click directly. `HTMLElement.click()` is ignored by the browser for disabled form
 * controls, which would make the disabled tests pass without exercising the element's own guard.
 */
const dispatchClick = (element: Element): void => {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
};

/** Lets the deferred form action (a macrotask) run. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

interface Rendered {
  form: HTMLFormElement;
  control: TestSubmitter;
  input: HTMLInputElement;
  submissions: FormData[];
}

async function render(
  controlMarkup: string,
  wrapper = (inner: string) => inner,
): Promise<Rendered> {
  document.body.innerHTML = `<form>
    ${wrapper(`<input name="field" value="initial" required />${controlMarkup}`)}
  </form>`;
  const form = document.querySelector('form');
  const control = document.querySelector('su3-test-submitter');
  const input = document.querySelector('input');
  if (!form || !control || !input) throw new Error('Fixture was not rendered');
  await control.updateComplete;

  const submissions: FormData[] = [];
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submissions.push(new FormData(form));
  });
  return { form, control, input, submissions };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FormSubmitterElement', () => {
  it('defaults to type submit and reflects the type attribute', async () => {
    const { control } = await render('<su3-test-submitter>Go</su3-test-submitter>');
    expect(control.type).toBe('submit');

    control.type = 'reset';
    await control.updateComplete;
    expect(control.getAttribute('type')).toBe('reset');
  });

  it('submits the owning form', async () => {
    const { submissions } = await render('<su3-test-submitter>Go</su3-test-submitter>');
    await userEvent.click(page.getByRole('button', { name: 'Go' }));
    await expect.poll(() => submissions.length).toBe(1);
  });

  it('includes name and value only for the submission it triggered', async () => {
    const { form, submissions } = await render(
      '<su3-test-submitter name="action" value="save">Go</su3-test-submitter>',
    );
    await userEvent.click(page.getByRole('button', { name: 'Go' }));
    await expect.poll(() => submissions.length).toBe(1);

    expect(submissions[0]?.get('action')).toBe('save');
    expect(new FormData(form).has('action')).toBe(false);
  });

  it('omits the pair when no name is set', async () => {
    const { submissions } = await render(
      '<su3-test-submitter value="save">Go</su3-test-submitter>',
    );
    await userEvent.click(page.getByRole('button', { name: 'Go' }));
    await expect.poll(() => submissions.length).toBe(1);
    expect([...(submissions[0]?.keys() ?? [])]).toEqual(['field']);
  });

  it('does not submit when constraint validation fails', async () => {
    const { input, submissions } = await render('<su3-test-submitter>Go</su3-test-submitter>');
    input.value = '';
    await userEvent.click(page.getByRole('button', { name: 'Go' }));
    await settle();
    expect(submissions).toHaveLength(0);
  });

  it('resets the form for type reset', async () => {
    const { input, submissions } = await render(
      '<su3-test-submitter type="reset">Reset</su3-test-submitter>',
    );
    input.value = 'changed';
    await userEvent.click(page.getByRole('button', { name: 'Reset' }));
    await expect.poll(() => input.value).toBe('initial');
    expect(submissions).toHaveLength(0);
  });

  it('does nothing for type button', async () => {
    const { input, submissions } = await render(
      '<su3-test-submitter type="button">Plain</su3-test-submitter>',
    );
    input.value = 'changed';
    await userEvent.click(page.getByRole('button', { name: 'Plain' }));
    await settle();
    expect(submissions).toHaveLength(0);
    expect(input.value).toBe('changed');
  });

  it('does nothing when disabled', async () => {
    const { control, submissions } = await render(
      '<su3-test-submitter disabled>Go</su3-test-submitter>',
    );
    dispatchClick(control);
    await settle();
    expect(submissions).toHaveLength(0);
  });

  it('does nothing inside a disabled fieldset', async () => {
    const { control, submissions } = await render(
      '<su3-test-submitter>Go</su3-test-submitter>',
      (inner) => `<fieldset disabled>${inner}</fieldset>`,
    );
    await control.updateComplete;
    await expect.element(page.getByRole('button', { name: 'Go' })).toBeDisabled();
    dispatchClick(control);
    await settle();
    expect(submissions).toHaveLength(0);
  });

  it('respects preventDefault() from a click listener added after construction', async () => {
    const { control, submissions } = await render('<su3-test-submitter>Go</su3-test-submitter>');
    control.addEventListener('click', (event) => {
      event.preventDefault();
    });
    await userEvent.click(page.getByRole('button', { name: 'Go' }));
    await settle();
    expect(submissions).toHaveLength(0);
  });

  it('does nothing outside a form', async () => {
    document.body.innerHTML = '<su3-test-submitter>Go</su3-test-submitter>';
    const control = document.querySelector('su3-test-submitter');
    await control?.updateComplete;
    expect(control?.form).toBeNull();
    await userEvent.click(page.getByRole('button', { name: 'Go' }));
    await settle();
  });

  it('exposes the owning form', async () => {
    const { form, control } = await render('<su3-test-submitter>Go</su3-test-submitter>');
    expect(control.form).toBe(form);
  });
});
