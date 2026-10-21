import type { PropertyDeclarations, PropertyValues } from 'lit';
import {
  FormAssociatedElement,
  type FormRestoreState,
  type FormStateRestoreMode,
} from './form-associated.ts';

/**
 * Base class for two-state form controls (checkbox, switch). The accessible and keyboard element is
 * a native `<input type="checkbox">` that the subclass renders inside its shadow root and covers
 * with its visuals; this class owns the state around it:
 *
 * - `checked` (the `checked` attribute sets the initial state, and a form reset returns to it),
 * - `required`, which makes an unchecked control invalid (`valueMissing`),
 * - the form value: `value` (default `on`) while checked, nothing otherwise,
 * - the restore state (`checked` or `unchecked`).
 *
 * The inner input's `input` event crosses the shadow boundary on its own and is handled first, so
 * listeners on the host see the new `checked`; `change` does not cross and is re-dispatched.
 */
export abstract class FormCheckableElement extends FormAssociatedElement {
  static override properties: PropertyDeclarations = {
    checked: { type: Boolean },
    required: { type: Boolean, reflect: true },
  };

  /** Whether the control is on. The `checked` attribute sets the initial value. */
  declare checked: boolean;

  /** Whether the control must be on for the form to be valid. */
  declare required: boolean;

  constructor() {
    super();
    this.checked = false;
    this.required = false;
    this.value = 'on';
  }

  /** The message shown when `required` is set and the control is off. */
  protected get requiredMessage(): string {
    return 'Please check this box if you want to proceed.';
  }

  /** The inner native input, once rendered. */
  protected get inputElement(): HTMLInputElement | null {
    return this.renderRoot.querySelector('input');
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('checked') || changed.has('value') || changed.has('required')) {
      this.internals.setFormValue(
        this.checked ? this.value || 'on' : null,
        this.checked ? 'checked' : 'unchecked',
      );
      this.revalidate();
    }
  }

  protected override revalidate(): void {
    const missing = this.required && !this.checked;
    this.setValidityState(
      { valueMissing: missing },
      missing ? this.requiredMessage : '',
      this.inputElement ?? undefined,
    );
  }

  protected override resetFormState(): void {
    this.checked = this.hasAttribute('checked');
  }

  protected override restoreFormState(state: FormRestoreState, mode: FormStateRestoreMode): void {
    if (mode === 'restore' || typeof state === 'string') {
      this.checked = state === 'checked';
    }
  }

  /** Called after the user toggled the control, before `change` fires. */
  protected afterUserToggle(): void {
    // Subclasses clear transient states here (for example `indeterminate`).
  }

  /** Handles the inner input's `input` event: synchronizes `checked` before host listeners run. */
  protected handleInput = (event: Event): void => {
    this.checked = (event.target as HTMLInputElement).checked;
    this.afterUserToggle();
  };

  /** Handles the inner input's `change` event, which does not cross the shadow boundary. */
  protected handleChange = (): void => {
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };
}
