import {
  html,
  nothing,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import {
  FormAssociatedElement,
  type FormRestoreState,
} from '../../../behaviors/form-associated.ts';
import { PopupController } from '../../../behaviors/popup-controller.ts';
import type { PopupPlacement } from '../../../behaviors/popup-position.ts';
import { Typeahead } from '../../../behaviors/typeahead.ts';
import type { Su3Option } from '../option/option.ts';
import { selectStyles } from './select.styles.ts';

/** The look of the field: a border around the container, or a tinted container with a line below. */
export type SelectVariant = 'outlined' | 'filled';

/**
 * A form-associated control that picks one value from a list. The label sits above a button that
 * shows the chosen option (or the placeholder); activating it opens a listbox of `su3-option`
 * elements placed below the field (or above, when there is no room). A press outside, Escape and Tab
 * close the list, and the chosen option, a selection and Escape return focus to the button.
 *
 * Keyboard: Enter, Space, ArrowDown and ArrowUp on the button open the list on the chosen option (the
 * first option for ArrowDown, the last for ArrowUp when nothing is chosen); inside, the arrow keys
 * move with wrap-around, Home and End jump, typing letters moves to the next option whose text starts
 * with them, Enter and Space choose. Disabled options are skipped.
 *
 * Choosing an option fires `input` and then `change` on the select. `required` makes an empty select
 * invalid (`valueMissing`); the error shows after the user leaves the field or a submit fails, or
 * whenever `error-text` is set. A form reset returns to the option marked `selected`, and a state
 * restore applies the saved value. For a field without a visible label use `aria-label` on the host.
 * The button has the `combobox` role so that the required and invalid states can be announced. The
 * text shown for the chosen option is read when the options change, not when an option's text is
 * edited afterwards. Multiple selection, groups and search are not supported.
 *
 * @tagname su3-select
 * @summary A form-associated single-choice select with label, supporting text and validation.
 *
 * @slot - The `su3-option` elements.
 *
 * @csspart field - The wrapper around label, container and supporting text.
 * @csspart label - The label.
 * @csspart container - The button that shows the chosen option.
 * @csspart surface - The popup list.
 * @csspart supporting-text - The supporting or error text.
 *
 * @cssprop [--su3-comp-select-container-color] - Background of the filled variant.
 * @cssprop [--su3-comp-select-border-color] - Border color.
 * @cssprop [--su3-comp-select-text-color] - Text color.
 * @cssprop [--su3-comp-select-label-color] - Label color.
 * @cssprop [--su3-comp-select-error-color] - Color of the invalid state.
 * @cssprop [--su3-comp-select-height] - Minimum height of the container.
 * @cssprop [--su3-comp-select-container-shape] - Corner radius of the container.
 * @cssprop [--su3-comp-select-menu-color] - Background of the popup.
 * @cssprop [--su3-comp-select-menu-shape] - Corner radius of the popup.
 * @cssprop [--su3-comp-select-menu-elevation] - Box shadow of the popup.
 * @cssprop [--su3-comp-select-offset] - Gap between the container and the popup.
 * @cssprop [--su3-comp-select-focus-ring-color] - Focus indicator color.
 * @cssprop [--su3-comp-select-focus-ring-width] - Focus indicator thickness.
 * @cssprop [--su3-comp-select-focus-ring-offset] - Gap between the container and its focus ring.
 *
 * @fires input - The user chose another option.
 * @fires change - The user chose another option (after `input`).
 */
export class Su3Select extends FormAssociatedElement {
  static override styles = selectStyles;

  static override properties: PropertyDeclarations = {
    variant: { reflect: true },
    label: {},
    supportingText: { attribute: 'supporting-text' },
    errorText: { attribute: 'error-text' },
    placeholder: {},
    required: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
    touched: { state: true },
    optionsVersion: { state: true },
  };

  /** The look of the field. */
  declare variant: SelectVariant;

  /** The visible label, shown above the button. */
  declare label: string;

  /** Help shown under the field while there is no error. */
  declare supportingText: string;

  /** An error shown under the field whatever the validity; empty to use the validation message. */
  declare errorText: string;

  /** Shown in the button while nothing is chosen. */
  declare placeholder: string;

  /** Makes an empty select invalid. */
  declare required: boolean;

  /** Whether the list is shown. */
  declare open: boolean;

  /** Whether the user has left the field or a submit failed; errors are shown only afterwards. */
  declare touched: boolean;

  /** Changes whenever the options change, so the shown text follows them. */
  declare private optionsVersion: number;

  #initialized = false;
  #initialValue = '';
  #entry: 'selected' | 'last' = 'selected';
  readonly #typeahead = new Typeahead();
  readonly #popup: PopupController = new PopupController(this, {
    surface: (): HTMLElement | null => this.#surface(),
    anchor: (): Element | null => this.#container(),
    placement: (): PopupPlacement => ({ side: 'bottom', align: 'start', matchWidth: true }),
    onOutsidePress: () => {
      this.#close(false);
    },
  });

  constructor() {
    super();
    this.variant = 'outlined';
    this.label = '';
    this.supportingText = '';
    this.errorText = '';
    this.placeholder = '';
    this.required = false;
    this.open = false;
    this.touched = false;
    this.optionsVersion = 0;
    // A failed submit or checkValidity() fires `invalid`; show the error from then on.
    this.addEventListener('invalid', () => {
      this.touched = true;
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#typeahead.clear();
    // Removing the element hides the popup, so the state follows it.
    this.open = false;
  }

  #surface(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>('.surface');
  }

  #container(): HTMLButtonElement | null {
    return this.renderRoot.querySelector<HTMLButtonElement>('.container');
  }

  #options(): Su3Option[] {
    return [...this.children].filter(
      (child): child is Su3Option => child.localName === 'su3-option',
    );
  }

  #enabled(): Su3Option[] {
    return this.#options().filter((option) => !option.disabled);
  }

  /** Chooses the first option with this value and clears the others; an unknown value clears all. */
  #apply(value: string): void {
    let taken = false;
    for (const option of this.#options()) {
      const match: boolean = value !== '' && !taken && option.value === value;
      option.selected = match;
      taken ||= match;
    }
    this.value = this.#options().find((option) => option.selected)?.value ?? '';
  }

  protected override willUpdate(changed: PropertyValues): void {
    // A disabled select cannot be open, and does not reopen by itself when it is enabled again.
    if (changed.has('disabled') && this.disabled) this.open = false;
    // A value set from outside is applied here, so the derived value does not cost a second update.
    if (this.#initialized && changed.has('value')) this.#apply(this.value);
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('value')) {
      this.internals.setFormValue(this.value === '' ? null : this.value, this.value);
    }
    this.revalidate();
    if (this.#popup.sync(this.open && !this.isDisabled)) this.#focusEntry();
  }

  protected override revalidate(): void {
    const container = this.#container();
    this.setValidityState(
      { valueMissing: this.required && this.value === '' },
      'Please select an item in the list.',
      container ?? undefined,
    );
  }

  protected override resetFormState(): void {
    this.#apply(this.#initialValue);
    this.touched = false;
  }

  protected override restoreFormState(state: FormRestoreState): void {
    if (typeof state === 'string') this.#apply(state);
  }

  #onSlotChange = (): void => {
    if (!this.#initialized) {
      this.#initialized = true;
      const marked = this.#options().find((option) => option.hasAttribute('selected'));
      this.#initialValue = marked?.value ?? this.getAttribute('value') ?? '';
      // A value set before the options existed wins over their `selected` attributes.
      this.#apply(this.value || marked?.value || '');
    } else {
      this.#apply(this.value);
    }
    this.optionsVersion += 1;
  };

  /** The text shown in the button, and whether it is the placeholder. */
  #shown(): { text: string; placeholder: boolean } {
    const chosen = this.#options().find((option) => option.selected);
    if (chosen) return { text: chosen.label, placeholder: false };
    return { text: this.placeholder, placeholder: true };
  }

  /** The text under the field: the explicit error, the validation message once touched, or help. */
  #supportingMessage(): { text: string; invalid: boolean } {
    if (this.errorText !== '') return { text: this.errorText, invalid: true };
    if (this.touched && !this.validity.valid) {
      return { text: this.validationMessage, invalid: true };
    }
    return { text: this.supportingText, invalid: false };
  }

  #focusEntry(): void {
    const enabled = this.#enabled();
    const chosen = enabled.find((option) => option.selected);
    const target = chosen ?? (this.#entry === 'last' ? enabled[enabled.length - 1] : enabled[0]);
    target?.focus();
  }

  #close(returnFocus: boolean): void {
    if (!this.open) return;
    this.open = false;
    if (returnFocus) this.#container()?.focus();
  }

  #choose(option: Su3Option): void {
    if (option.disabled) return;
    const changed = option.value !== this.value || !option.selected;
    if (changed) {
      this.#apply(option.value);
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
    this.#close(true);
  }

  #openFrom(entry: 'selected' | 'last'): void {
    if (this.isDisabled) return;
    this.#entry = entry;
    this.open = true;
  }

  #onTriggerClick = (): void => {
    if (this.open) this.#close(true);
    else this.#openFrom('selected');
  };

  #onTriggerKeyDown = (event: KeyboardEvent): void => {
    if (this.open) {
      // Focus stays on the button when no option can take it (all disabled): Escape still closes.
      if (event.key === 'Escape') this.#close(true);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.#openFrom(event.key === 'ArrowDown' ? 'selected' : 'last');
    }
  };

  #onSurfaceClick = (event: Event): void => {
    const option = event
      .composedPath()
      .find(
        (node): node is Su3Option => node instanceof Element && node.localName === 'su3-option',
      );
    if (option) this.#choose(option);
  };

  #onSurfaceKeyDown = (event: KeyboardEvent): void => {
    const options = this.#enabled();
    const current = options.findIndex((option) => option === event.target);
    const move = (index: number): void => {
      event.preventDefault();
      options[(index + options.length) % options.length]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        move(current + 1);
        return;
      case 'ArrowUp':
        move(current < 0 ? -1 : current - 1);
        return;
      case 'Home':
        move(0);
        return;
      case 'End':
        move(-1);
        return;
      case 'Escape':
        event.preventDefault();
        this.#close(true);
        return;
      case 'Tab':
        // No preventDefault: focus returns to the button and Tab then moves on from there.
        this.#close(true);
        return;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const option = options[current];
        if (option) this.#choose(option);
        return;
      }
      default:
        if (Typeahead.isPrintable(event)) {
          const labels = options.map((option) => option.label.toLowerCase());
          options[this.#typeahead.find(event.key, labels, current)]?.focus();
        }
    }
  };

  #onFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget;
    if (next instanceof Node && this.contains(next)) return;
    if (!this.open) this.touched = true;
  };

  protected override render(): TemplateResult {
    const { text, invalid } = this.#supportingMessage();
    const shown = this.#shown();
    const hasLabel = this.label !== '';
    const classes = ['field', invalid ? 'invalid' : '', this.isDisabled ? 'disabled' : '']
      .filter(Boolean)
      .join(' ');
    return html`<div class=${classes} part="field" @focusout=${this.#onFocusOut}>
      <span class="label" id="label" part="label" ?hidden=${!hasLabel}
        >${this.label}${
          this.required ? html`<span class="required" aria-hidden="true">*</span>` : nothing
        }</span
      >
      <span id="name" hidden>${hasLabel ? '' : (this.accessibleName ?? '')}</span>
      <button
        class="container"
        part="container"
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded=${String(this.open)}
        aria-labelledby=${hasLabel ? 'label value' : this.accessibleName ? 'name value' : 'value'}
        aria-required=${this.required ? 'true' : nothing}
        aria-invalid=${invalid ? 'true' : nothing}
        aria-describedby=${text === '' ? nothing : 'supporting'}
        ?disabled=${this.isDisabled}
        @click=${this.#onTriggerClick}
        @keydown=${this.#onTriggerKeyDown}
      >
        <span class=${shown.placeholder ? 'value placeholder' : 'value'} id="value"
          >${shown.text}</span
        >
        <svg
          class="chevron flip"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        class="surface"
        part="surface"
        role="listbox"
        popover="manual"
        aria-labelledby=${hasLabel ? 'label' : nothing}
        aria-label=${hasLabel ? nothing : (this.accessibleName ?? nothing)}
        @click=${this.#onSurfaceClick}
        @keydown=${this.#onSurfaceKeyDown}
      >
        <slot @slotchange=${this.#onSlotChange}></slot>
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
    'su3-select': Su3Select;
  }
}
