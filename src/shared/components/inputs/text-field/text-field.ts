import { html, nothing, type PropertyDeclarations, type TemplateResult } from 'lit';
import { live } from 'lit/directives/live.js';
import { FormAssociatedElement, type FormRestoreState } from '../../../behaviors/index.ts';
import { textFieldStyles } from './text-field.styles.ts';

/** Visual style of the container. */
export type TextFieldVariant = 'outlined' | 'filled';

/** The input types the field supports. */
export type TextFieldType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

/**
 * A single-line text field that takes part in forms. The label sits above the input (it does not
 * float), supporting text sits below, and the browser's constraint validation runs on a native input
 * inside the shadow root: `required`, `minlength`, `maxlength`, `pattern` and the `type` (for example
 * `email`) all work, and `checkValidity()`, `setCustomValidity()` and the `invalid` event behave as on
 * a native control.
 *
 * An error is shown after the user leaves the field (or after a failed submit), using the browser's
 * message, or whenever `error-text` is set. A form reset restores the `value` attribute, and a state
 * restore applies the saved value. For a field without a visible label use `aria-label` on the host.
 *
 * @tagname su3-text-field
 * @summary A form-associated single-line text input with label, supporting text and validation.
 *
 * @slot leading - An icon before the input.
 * @slot trailing - An icon or control after the input.
 *
 * @csspart field - The wrapper around label, container and supporting text.
 * @csspart label - The label.
 * @csspart container - The box around the input and the slots.
 * @csspart input - The native input.
 * @csspart supporting-text - The supporting or error text.
 *
 * @cssprop [--su3-comp-text-field-container-shape] - Corner radius.
 * @cssprop [--su3-comp-text-field-container-color] - Background of the filled variant.
 * @cssprop [--su3-comp-text-field-border-color] - Border color.
 * @cssprop [--su3-comp-text-field-height] - Minimum height of the container.
 * @cssprop [--su3-comp-text-field-padding-inline] - Horizontal padding.
 * @cssprop [--su3-comp-text-field-text-color] - Input text color.
 * @cssprop [--su3-comp-text-field-label-color] - Label color.
 * @cssprop [--su3-comp-text-field-error-color] - Color of the invalid state.
 * @cssprop [--su3-comp-text-field-focus-ring-color] - Focus indicator color.
 * @cssprop [--su3-comp-text-field-focus-ring-width] - Focus indicator thickness.
 * @cssprop [--su3-comp-text-field-focus-ring-offset] - Gap between the container and its focus indicator.
 *
 * @fires {Event} input - The value changed through user input; `value` is already updated.
 * @fires {Event} change - The user committed the value (on blur or Enter).
 */
export class Su3TextField extends FormAssociatedElement {
  static override styles = textFieldStyles;

  static override properties: PropertyDeclarations = {
    variant: { reflect: true },
    label: {},
    supportingText: { attribute: 'supporting-text' },
    errorText: { attribute: 'error-text' },
    type: { reflect: true },
    placeholder: {},
    readonly: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    minLength: { type: Number, attribute: 'minlength' },
    maxLength: { type: Number, attribute: 'maxlength' },
    pattern: {},
    autocomplete: {},
    inputMode: { attribute: 'inputmode' },
    touched: { state: true },
  };

  /** Container style. */
  declare variant: TextFieldVariant;

  /** The visible label, shown above the input. */
  declare label: string;

  /** Helper text below the field. */
  declare supportingText: string;

  /** Shows the field as invalid with this message, whatever the validation state. */
  declare errorText: string;

  /** The input type. */
  declare type: TextFieldType;

  declare placeholder: string;

  /** The user can read and select the value but not change it. */
  declare readonly: boolean;

  /** The field must have a value for the form to be valid. */
  declare required: boolean;

  /** Minimum number of characters, checked once the user has edited the value. */
  declare minLength: number | undefined;

  /** Maximum number of characters. */
  declare maxLength: number | undefined;

  /** A regular expression the whole value must match. */
  declare pattern: string;

  /** The `autocomplete` hint for the browser. */
  declare autocomplete: string;

  /** The `inputmode` hint for on-screen keyboards. */
  declare inputMode: string;

  /** Whether the user has left the field or a submit failed; errors are shown only afterwards. */
  declare touched: boolean;

  constructor() {
    super();
    this.variant = 'outlined';
    this.label = '';
    this.supportingText = '';
    this.errorText = '';
    this.type = 'text';
    this.placeholder = '';
    this.readonly = false;
    this.required = false;
    this.minLength = undefined;
    this.maxLength = undefined;
    this.pattern = '';
    this.autocomplete = '';
    this.inputMode = '';
    this.touched = false;
    // A failed submit or checkValidity() fires `invalid`; show the error from then on.
    this.addEventListener('invalid', () => {
      this.touched = true;
    });
  }

  /** The native input, once rendered. */
  protected get inputElement(): HTMLInputElement | null {
    return this.renderRoot.querySelector('input');
  }

  /** Selects the whole value. */
  select(): void {
    this.inputElement?.select();
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    super.updated(changed);
    if (changed.has('value')) {
      this.internals.setFormValue(this.value, this.value);
    }
    // Constraints live on the native input, which has just been rendered with the new values.
    this.revalidate();
  }

  protected override revalidate(): void {
    const input = this.inputElement;
    if (!input) {
      this.setValidityState({});
      return;
    }
    const { validity } = input;
    this.setValidityState(
      {
        badInput: validity.badInput,
        patternMismatch: validity.patternMismatch,
        rangeOverflow: validity.rangeOverflow,
        rangeUnderflow: validity.rangeUnderflow,
        stepMismatch: validity.stepMismatch,
        tooLong: validity.tooLong,
        tooShort: validity.tooShort,
        typeMismatch: validity.typeMismatch,
        valueMissing: validity.valueMissing,
      },
      input.validationMessage,
      input,
    );
  }

  protected override resetFormState(): void {
    this.value = this.getAttribute('value') ?? '';
    this.touched = false;
  }

  protected override restoreFormState(state: FormRestoreState): void {
    if (typeof state === 'string') this.value = state;
  }

  /** The text under the field: the explicit error, the validation message once touched, or help. */
  #supportingMessage(): { text: string; invalid: boolean } {
    if (this.errorText !== '') return { text: this.errorText, invalid: true };
    if (this.touched && !this.validity.valid) {
      return { text: this.validationMessage, invalid: true };
    }
    return { text: this.supportingText, invalid: false };
  }

  #onInput = (event: Event): void => {
    this.value = (event.target as HTMLInputElement).value;
    this.revalidate();
  };

  #onChange = (): void => {
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  #onBlur = (): void => {
    this.touched = true;
  };

  protected override render(): TemplateResult {
    const { text, invalid } = this.#supportingMessage();
    const classes = ['field', invalid ? 'invalid' : '', this.isDisabled ? 'disabled' : '']
      .filter(Boolean)
      .join(' ');
    return html`<div class=${classes} part="field">
      <label class="label" part="label" for="input" ?hidden=${this.label === ''}
        >${this.label}${
          this.required ? html`<span class="required" aria-hidden="true">*</span>` : nothing
        }</label
      >
      <div class="container" part="container">
        <slot name="leading"></slot>
        <input
          id="input"
          class="input"
          part="input"
          type=${this.type}
          .value=${live(this.value)}
          placeholder=${this.placeholder || nothing}
          ?required=${this.required}
          ?readonly=${this.readonly}
          ?disabled=${this.isDisabled}
          minlength=${this.minLength ?? nothing}
          maxlength=${this.maxLength ?? nothing}
          pattern=${this.pattern || nothing}
          autocomplete=${this.autocomplete || nothing}
          inputmode=${this.inputMode || nothing}
          aria-label=${this.label === '' ? (this.accessibleName ?? nothing) : nothing}
          aria-invalid=${invalid ? 'true' : nothing}
          aria-describedby=${text === '' ? nothing : 'supporting'}
          @input=${this.#onInput}
          @change=${this.#onChange}
          @blur=${this.#onBlur}
        />
        <slot name="trailing"></slot>
      </div>
      <div
        id="supporting"
        class="supporting"
        part="supporting-text"
        aria-live="polite"
        ?hidden=${text === ''}
      >
        ${text}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-text-field': Su3TextField;
  }
}
