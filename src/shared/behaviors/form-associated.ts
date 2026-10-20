import { LitElement, type PropertyDeclarations } from 'lit';

/**
 * Base class for form-associated custom elements: it attaches `ElementInternals`, exposes `disabled`,
 * `name` and `value`, and tracks the disabled state reported by the browser (`<fieldset disabled>`).
 *
 * It does not yet provide validity or `formResetCallback`/`formStateRestoreCallback` handling; the
 * first control that needs them (a checkbox or text field, Phase 7) adds them here.
 *
 * Base classes are used instead of mixins because every consumer so far fits one hierarchy
 * (`FormAssociatedElement` -> `FormSubmitterElement`), and class expressions would need explicit
 * return types to be emitted in declaration files.
 */
export abstract class FormAssociatedElement extends LitElement {
  /** Makes the browser treat instances as form controls. */
  static formAssociated = true;

  static override properties: PropertyDeclarations = {
    disabled: { type: Boolean, reflect: true },
    name: { reflect: true },
    value: {},
  };

  /** Whether the control is disabled. A disabled control ignores user interaction. */
  declare disabled: boolean;

  /** The name submitted with the form data. Reflected because the form reads the attribute. */
  declare name: string;

  /** The value submitted with the form data. */
  declare value: string;

  readonly #internals: ElementInternals;
  /** The disabled state the browser reports: the `disabled` attribute or a disabled fieldset. */
  #reportedDisabled = false;

  constructor() {
    super();
    this.disabled = false;
    this.name = '';
    this.value = '';
    this.#internals = this.attachInternals();
  }

  /** The form that owns this control, or `null`. */
  get form(): HTMLFormElement | null {
    return this.#internals.form;
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
}
