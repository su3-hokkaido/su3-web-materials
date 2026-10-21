import { html, nothing, type PropertyDeclarations, type TemplateResult } from 'lit';
import { FormCheckableElement } from '../../../behaviors/index.ts';
import { switchStyles } from './switch.styles.ts';

/**
 * An on/off switch that takes part in forms: it submits `name=value` while on, can be required,
 * resets to its `checked` attribute and restores its state. Put the label in the default slot; for a
 * control without visible text use `aria-label` on the host.
 *
 * It is a native checkbox with `role="switch"` inside the shadow root, so Space toggles it and
 * assistive technology announces "on" and "off". Use a switch for a setting that takes effect
 * immediately and a checkbox for a choice that is submitted later.
 *
 * @tagname su3-switch
 * @summary A form-associated on/off switch with a label slot.
 *
 * @slot - The label.
 *
 * @csspart input - The native checkbox with the switch role (invisible, covering the control).
 * @csspart track - The visible track.
 * @csspart thumb - The moving thumb.
 * @csspart label - The wrapper around the label slot.
 *
 * @cssprop [--su3-comp-switch-track-width] - Track width.
 * @cssprop [--su3-comp-switch-track-height] - Track height.
 * @cssprop [--su3-comp-switch-thumb-size] - Thumb diameter.
 * @cssprop [--su3-comp-switch-selected-track-color] - Track color when on.
 * @cssprop [--su3-comp-switch-label-color] - Label color.
 * @cssprop [--su3-comp-switch-gap] - Space between the track and the label.
 * @cssprop [--su3-comp-switch-focus-ring-color] - Focus indicator color.
 * @cssprop [--su3-comp-switch-focus-ring-width] - Focus indicator thickness.
 * @cssprop [--su3-comp-switch-focus-ring-offset] - Gap between the track and its focus indicator.
 *
 * @fires {Event} input - The user toggled the switch; `checked` is already updated.
 * @fires {Event} change - The user finished toggling the switch.
 */
export class Su3Switch extends FormCheckableElement {
  static override styles = switchStyles;

  static override properties: PropertyDeclarations = {
    hasLabel: { state: true },
  };

  /** Whether the default slot has content. */
  declare hasLabel: boolean;

  constructor() {
    super();
    this.hasLabel = true;
  }

  protected override get requiredMessage(): string {
    return 'Please turn this switch on to proceed.';
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
        role="switch"
        .checked=${this.checked}
        ?disabled=${this.isDisabled}
        aria-required=${this.required ? 'true' : nothing}
        aria-label=${this.accessibleName ?? nothing}
        @input=${this.handleInput}
        @change=${this.handleChange}
      />
      <span class="track" part="track" aria-hidden="true"
        ><span class="thumb" part="thumb"></span
      ></span>
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
    'su3-switch': Su3Switch;
  }
}
