import { html, LitElement, type PropertyDeclarations, type TemplateResult } from 'lit';
import { menuItemStyles } from './menu-item.styles.ts';

/**
 * One command in a `su3-menu`. The item is itself the focus target: the element sets `role`
 * (`menuitem`, or `menuitemcheckbox` with `checkable`), `aria-checked` and `aria-disabled` as
 * attributes on the host, and the menu moves focus between items. Activating an item is handled by the menu, which fires
 * `select`; use an item inside a menu.
 *
 * Put the label in the default slot, an icon in the `leading` slot and, optionally, text such as a
 * keyboard shortcut in the `trailing` slot. With `checkable` the item shows a check mark while
 * `checked` and toggles it when activated; the leading slot is then not shown.
 *
 * @tagname su3-menu-item
 * @summary One command of a menu.
 *
 * @slot - The label.
 * @slot leading - An icon before the label (not shown while the item is `checkable`).
 * @slot trailing - Text after the label, such as a shortcut.
 *
 * @csspart item - The row.
 * @csspart label - The wrapper around the default slot.
 *
 * @cssprop [--su3-comp-menu-label-color] - Label and icon color.
 * @cssprop [--su3-comp-menu-focus-ring-color] - Focus indicator color.
 * @cssprop [--su3-comp-menu-focus-ring-width] - Focus indicator thickness.
 */
export class Su3MenuItem extends LitElement {
  static override styles = menuItemStyles;

  static override properties: PropertyDeclarations = {
    value: {},
    disabled: { type: Boolean, reflect: true },
    checkable: { type: Boolean, reflect: true },
    checked: { type: Boolean, reflect: true },
  };

  /** The value the menu reports in `select`. Defaults to the empty string. */
  declare value: string;

  /** Makes the item unavailable: it is skipped by the keyboard and cannot be activated. */
  declare disabled: boolean;

  /** Makes the item a checkbox that the menu toggles when it is activated. */
  declare checkable: boolean;

  /** Whether a checkable item is checked. */
  declare checked: boolean;

  constructor() {
    super();
    this.value = '';
    this.disabled = false;
    this.checkable = false;
    this.checked = false;
  }

  protected override willUpdate(): void {
    this.setAttribute('role', this.checkable ? 'menuitemcheckbox' : 'menuitem');
    if (this.checkable) this.setAttribute('aria-checked', String(this.checked));
    else this.removeAttribute('aria-checked');
    if (this.disabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
  }

  protected override render(): TemplateResult {
    return html`<div class="item" part="item">
      ${
        this.checkable
          ? html`<svg
              class=${this.checked ? 'check checked' : 'check'}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>`
          : html`<slot name="leading"></slot>`
      }
      <span class="label" part="label"><slot></slot></span>
      <span class="trailing"><slot name="trailing"></slot></span>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-menu-item': Su3MenuItem;
  }
}
