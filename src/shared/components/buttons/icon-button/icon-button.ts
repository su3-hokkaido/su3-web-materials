import { html, nothing, type PropertyDeclarations, type TemplateResult } from 'lit';
import { FormSubmitterElement } from '../../../behaviors/index.ts';
import { iconButtonStyles } from './icon-button.styles.ts';

/** Emphasis levels, from the most to the least prominent. */
export type IconButtonVariant = 'filled' | 'tonal' | 'outlined' | 'standard';

/** Control sizes: 32, 40 and 48px square. */
export type IconButtonSize = 'sm' | 'md' | 'lg';

/**
 * A square button that shows only an icon. It always needs an accessible name: put `aria-label` on
 * the host (it is forwarded to the inner button).
 *
 * With `toggle` it keeps an on/off state in `selected` (announced through `aria-pressed`) and fires
 * `change` when the user flips it; an optional icon in the `selected` slot replaces the default one
 * while on. Without `toggle` it is a plain action button with the same form behavior as
 * `su3-button`, except that `type` defaults to `button`.
 *
 * @tagname su3-icon-button
 * @summary A square icon button with four emphasis levels and an optional toggle state.
 *
 * @slot - The icon.
 * @slot selected - The icon shown while a toggle button is selected (optional).
 *
 * @csspart button - The interactive element.
 *
 * @cssprop [--su3-comp-icon-button-container-color] - Background color.
 * @cssprop [--su3-comp-icon-button-icon-color] - Icon color.
 * @cssprop [--su3-comp-icon-button-border-color] - Border color.
 * @cssprop [--su3-comp-icon-button-container-shape] - Corner radius.
 * @cssprop [--su3-comp-icon-button-size] - Width and height.
 * @cssprop [--su3-comp-icon-button-icon-size] - Size of slotted icons.
 * @cssprop [--su3-comp-icon-button-focus-ring-color] - Focus indicator color.
 * @cssprop [--su3-comp-icon-button-focus-ring-width] - Focus indicator thickness.
 * @cssprop [--su3-comp-icon-button-focus-ring-offset] - Gap between the button and its focus indicator.
 *
 * @fires {Event} change - A toggle button was flipped by the user; `selected` is already updated.
 */
export class Su3IconButton extends FormSubmitterElement {
  static override styles = iconButtonStyles;

  static override properties: PropertyDeclarations = {
    variant: { reflect: true },
    size: { reflect: true },
    toggle: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
    hasSelectedIcon: { state: true },
  };

  /** Emphasis level. */
  declare variant: IconButtonVariant;

  /** Control size. */
  declare size: IconButtonSize;

  /** Makes the button a toggle: it keeps an on/off state in `selected` and exposes `aria-pressed`. */
  declare toggle: boolean;

  /** Whether a toggle button is on. Ignored without `toggle`. */
  declare selected: boolean;

  /** Whether the `selected` slot has content. */
  declare hasSelectedIcon: boolean;

  constructor() {
    super();
    this.variant = 'standard';
    this.size = 'md';
    this.toggle = false;
    this.selected = false;
    this.hasSelectedIcon = false;
    this.type = 'button';
  }

  protected override willUpdate(): void {
    this.hasSelectedIcon = this.querySelector(':scope > [slot="selected"]') !== null;
  }

  protected override render(): TemplateResult {
    return html`<button
      class=${this.hasSelectedIcon ? 'control has-selected-icon' : 'control'}
      part="button"
      type="button"
      ?disabled=${this.isDisabled}
      aria-pressed=${this.toggle ? String(this.selected) : nothing}
      aria-label=${this.accessibleName ?? nothing}
      @click=${this.#onControlClick}
    >
      <slot></slot>
      <slot name="selected" @slotchange=${this.#onSelectedSlotChange}></slot>
    </button>`;
  }

  #onSelectedSlotChange = (): void => {
    this.requestUpdate();
  };

  #onControlClick = (): void => {
    if (!this.toggle || this.isDisabled) return;
    this.selected = !this.selected;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-icon-button': Su3IconButton;
  }
}
