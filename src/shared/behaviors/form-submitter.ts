import type { PropertyDeclarations } from 'lit';
import { FormAssociatedElement } from './form-associated.ts';

/** The `type` values of a button, as on `<button>`. */
export type FormSubmitterType = 'button' | 'submit' | 'reset';

/**
 * Base class for button-like controls that submit or reset their form.
 *
 * Custom elements cannot be a form's submitter, so the form is submitted with `requestSubmit()`
 * (which still runs constraint validation and fires `submit`) and the control's `name`/`value`
 * pair is placed in the form data only for the duration of that call.
 *
 * The action runs in a later task, after every `click` listener has finished, so a listener that
 * calls `preventDefault()` cancels it just as it would on a native button.
 */
export abstract class FormSubmitterElement extends FormAssociatedElement {
  static override properties: PropertyDeclarations = {
    type: { reflect: true },
  };

  /** What clicking does inside a form. Defaults to `submit`, like `<button>`. */
  declare type: FormSubmitterType;

  constructor() {
    super();
    this.type = 'submit';
    this.addEventListener('click', this.#onClick);
  }

  /** Whether a click may submit or reset the form. Subclasses add their own conditions. */
  protected get canPerformFormAction(): boolean {
    return !this.isDisabled;
  }

  #onClick = (event: Event): void => {
    // Defer to a macrotask: a microtask would run between two click listeners for trusted clicks,
    // before later listeners had a chance to call preventDefault().
    setTimeout(() => {
      if (event.defaultPrevented) return;
      this.#performFormAction();
    }, 0);
  };

  #performFormAction(): void {
    const form = this.form;
    if (!form || !this.canPerformFormAction) return;

    if (this.type === 'reset') {
      form.reset();
      return;
    }
    if (this.type !== 'submit') return;

    try {
      this.internals.setFormValue(this.name ? this.value : null);
      form.requestSubmit();
    } finally {
      this.internals.setFormValue(null);
    }
  }
}
