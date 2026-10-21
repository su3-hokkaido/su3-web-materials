import { html, nothing, type PropertyDeclarations, type TemplateResult } from 'lit';
import { FormCheckableElement } from '../../../behaviors/index.ts';
import { checkboxStyles } from './checkbox.styles.ts';

/**
 * A checkbox that takes part in forms: it submits `name=value` while checked, can be required, resets
 * to its `checked` attribute and restores its state. Put the label in the default slot; for a
 * control without visible text use `aria-label` on the host.
 *
 * The accessible element is a native checkbox inside the shadow root, so keyboard, focus and screen
 * reader behavior are the platform's: Space toggles, a click on the label toggles, and an
 * `indeterminate` control is announced as mixed until the user toggles it.
 *
 * @tagname su3-checkbox
 * @summary A form-associated checkbox with a label slot and an indeterminate state.
 *
 * @slot - The label.
 *
 * @csspart input - The native checkbox (invisible, covering the control).
 * @csspart box - The visible box with the check or dash.
 * @csspart label - The wrapper around the label slot.
 *
 * @cssprop [--su3-comp-checkbox-size] - Size of the box.
 * @cssprop [--su3-comp-checkbox-container-shape] - Corner radius of the box.
 * @cssprop [--su3-comp-checkbox-border-color] - Border color of an unchecked box.
 * @cssprop [--su3-comp-checkbox-selected-container-color] - Fill color of a checked box.
 * @cssprop [--su3-comp-checkbox-mark-color] - Color of the check and dash.
 * @cssprop [--su3-comp-checkbox-label-color] - Label color.
 * @cssprop [--su3-comp-checkbox-gap] - Space between the box and the label.
 * @cssprop [--su3-comp-checkbox-focus-ring-color] - Focus indicator color.
 * @cssprop [--su3-comp-checkbox-focus-ring-width] - Focus indicator thickness.
 * @cssprop [--su3-comp-checkbox-focus-ring-offset] - Gap between the box and its focus indicator.
 *
 * @fires {Event} input - The user toggled the control; `checked` is already updated.
 * @fires {Event} change - The user finished toggling the control.
 */
export class Su3Checkbox extends FormCheckableElement {
  static override styles = checkboxStyles;

  static override properties: PropertyDeclarations = {
    indeterminate: { type: Boolean, reflect: true },
    hasLabel: { state: true },
  };

  /** Shows a dash instead of a check and is announced as mixed. The user's next toggle clears it. */
  declare indeterminate: boolean;

  /** Whether the default slot has content. */
  declare hasLabel: boolean;

  constructor() {
    super();
    this.indeterminate = false;
    this.hasLabel = true;
  }

  protected override afterUserToggle(): void {
    this.indeterminate = false;
  }

  protected override willUpdate(): void {
    this.hasLabel = [...this.childNodes].some((node) =>
      node instanceof Text ? node.data.trim() !== '' : node instanceof Element,
    );
  }

  protected override render(): TemplateResult {
    return html`<label class=${this.isDisabled ? 'root disabled' : 'root'}>
      <input
        class="input"
        part="input"
        type="checkbox"
        .checked=${this.checked}
        .indeterminate=${this.indeterminate}
        ?disabled=${this.isDisabled}
        aria-required=${this.required ? 'true' : nothing}
        aria-label=${this.accessibleName ?? nothing}
        @input=${this.handleInput}
        @change=${this.handleChange}
      />
      <span class="box" part="box" aria-hidden="true">
        <svg class="mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path
            class="check"
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path class="dash" d="M6 12h12" stroke-linecap="round" />
        </svg>
      </span>
      <span class="label" part="label" ?hidden=${!this.hasLabel}
        ><slot @slotchange=${this.#onSlotChange}></slot
      ></span>
    </label>`;
  }

  #onSlotChange = (): void => {
    this.requestUpdate();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-checkbox': Su3Checkbox;
  }
}
