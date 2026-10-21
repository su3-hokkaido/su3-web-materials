import { LitElement, type PropertyDeclarations } from 'lit';

/**
 * Base class for form-associated custom elements: it attaches `ElementInternals`, exposes `disabled`,
 * `name`, `value` and the accessible name, tracks the disabled state reported by the browser
 * (`<fieldset disabled>`), provides the native validity API, and turns the browser's form callbacks
 * into two hooks (`resetFormState`, `restoreFormState`) for subclasses.
 *
 * Base classes are used instead of mixins because every consumer so far fits one hierarchy
 * (`FormAssociatedElement` -> `FormSubmitterElement`), and class expressions would need explicit
 * return types to be emitted in declaration files.
 */
/** The `mode` argument of `formStateRestoreCallback`. */
export type FormStateRestoreMode = 'restore' | 'autocomplete';

/** The state a control saves with `setFormValue(value, state)` and gets back on restore. */
export type FormRestoreState = File | string | FormData | null;

export abstract class FormAssociatedElement extends LitElement {
  /** Makes the browser treat instances as form controls. */
  static formAssociated = true;

  /** Keeps `host.focus()` and the `:focus` state working although the control is inside. */
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override properties: PropertyDeclarations = {
    disabled: { type: Boolean, reflect: true },
    name: { reflect: true },
    value: {},
    accessibleName: { attribute: 'aria-label' },
  };

  /** Whether the control is disabled. A disabled control ignores user interaction. */
  declare disabled: boolean;

  /** The name submitted with the form data. Reflected because the form reads the attribute. */
  declare name: string;

  /** The value submitted with the form data. */
  declare value: string;

  /**
   * The accessible name for the inner control, read from the host's `aria-label`. Use it when the
   * control has no visible text label (for example an icon-only button).
   */
  declare accessibleName: string | null;

  readonly #internals: ElementInternals;
  /** The disabled state the browser reports: the `disabled` attribute or a disabled fieldset. */
  #reportedDisabled = false;
  #customValidity = '';

  constructor() {
    super();
    this.disabled = false;
    this.name = '';
    this.value = '';
    this.accessibleName = null;
    this.#internals = this.attachInternals();
  }

  /** The form that owns this control, or `null`. */
  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  /** The control's validity state: native flags, merged with a custom message when one is set. */
  get validity(): ValidityState {
    return this.#internals.validity;
  }

  get validationMessage(): string {
    return this.#internals.validationMessage;
  }

  /** False for a disabled control, which is exempt from constraint validation. */
  get willValidate(): boolean {
    return this.#internals.willValidate;
  }

  /** The `<label>` elements associated with this control. */
  get labels(): NodeList {
    return this.#internals.labels;
  }

  /** Checks the constraints; fires `invalid` and returns false when one fails. */
  checkValidity(): boolean {
    return this.#internals.checkValidity();
  }

  /** Like {@link checkValidity}, and also shows the browser's validation UI. */
  reportValidity(): boolean {
    return this.#internals.reportValidity();
  }

  /** Marks the control invalid with `message`; an empty string clears the custom error. */
  setCustomValidity(message: string): void {
    this.#customValidity = message;
    this.revalidate();
  }

  /**
   * Re-evaluates the control's constraints. Subclasses override it to call
   * {@link setValidityState} with their own flags (for example `valueMissing`); the default has no
   * constraints, so only a custom error can make the control invalid.
   */
  protected revalidate(): void {
    this.setValidityState({});
  }

  /**
   * Applies a validity state. A custom error set with {@link setCustomValidity} wins over the
   * constraint flags, as it does on native controls; empty flags with no custom error make the
   * control valid.
   *
   * @param anchor The element the browser's validation UI points at (usually the inner input).
   */
  protected setValidityState(flags: ValidityStateFlags, message = '', anchor?: HTMLElement): void {
    if (this.#customValidity === '') {
      this.#internals.setValidity(flags, message, anchor);
    } else {
      this.#internals.setValidity({ ...flags, customError: true }, this.#customValidity, anchor);
    }
  }

  /** `ElementInternals` for subclasses (form value, validity, ARIA). */
  protected get internals(): ElementInternals {
    return this.#internals;
  }

  /** True when disabled directly or through a disabled `<fieldset>` ancestor. */
  protected get isDisabled(): boolean {
    return this.disabled || this.#reportedDisabled;
  }

  /** Called by the browser when an ancestor `<fieldset>` changes the disabled state. */
  formDisabledCallback(disabled: boolean): void {
    this.#reportedDisabled = disabled;
    this.requestUpdate();
  }

  /** Called by the browser when the owning form is reset. */
  formResetCallback(): void {
    this.resetFormState();
  }

  /** Called by the browser to restore a saved state (history navigation, autofill). */
  formStateRestoreCallback(state: FormRestoreState, mode: FormStateRestoreMode): void {
    this.restoreFormState(state, mode);
  }

  /** Returns the control to its initial state. The default does nothing. */
  protected resetFormState(): void {
    // Nothing to reset in the base class.
  }

  /** Applies a state saved by `setFormValue(value, state)`. The default does nothing. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the default ignores the state
  protected restoreFormState(state: FormRestoreState, mode: FormStateRestoreMode): void {}
}
