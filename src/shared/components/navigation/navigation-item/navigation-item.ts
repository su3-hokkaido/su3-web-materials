import {
  html,
  LitElement,
  nothing,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { navigationItemStyles } from './navigation-item.styles.ts';

/** Where the label sits: below the icon (`stacked`, bar and rail) or beside it (`inline`, drawer). */
export type NavigationItemLayout = 'stacked' | 'inline';

/**
 * One destination of a `su3-navigation-bar`, `-rail` or `-drawer`: an icon in a pill indicator, a
 * label below or beside it and an optional badge. With `href` it renders an anchor, otherwise a
 * button; the selected item is marked with `aria-current="page"`. The container owns selection, so
 * use an item inside a bar, rail or drawer. The container picks the layout: `stacked` (label below
 * the icon, the default) or `inline` (label beside the icon, the pill covers the whole row).
 *
 * Put the label in the default slot, the icon in the `icon` slot and, optionally, a `su3-badge` in
 * the `badge` slot. The application owns routing: it listens to the container's `change` event (or
 * follows the link) and sets `selected`.
 *
 * @tagname su3-navigation-item
 * @summary One destination of a navigation bar, rail or drawer.
 *
 * @slot - The label.
 * @slot icon - The icon (decorative; the label names the item).
 * @slot badge - A `su3-badge` shown at the top end of the icon.
 *
 * @csspart control - The inner link or button.
 * @csspart indicator - The pill behind the icon (the icon wrapper in the inline layout).
 * @csspart label - The wrapper around the default slot.
 *
 * @cssprop [--su3-comp-navigation-bar-label-color] - Label and icon color of an unselected item.
 * @cssprop [--su3-comp-navigation-bar-selected-label-color] - Label color when selected.
 * @cssprop [--su3-comp-navigation-bar-indicator-color] - Color of the pill when selected.
 * @cssprop [--su3-comp-navigation-bar-indicator-icon-color] - Icon color when selected.
 * @cssprop [--su3-comp-navigation-bar-indicator-shape] - Radius of the pill.
 * @cssprop [--su3-comp-navigation-bar-focus-ring-color] - Focus indicator color.
 * @cssprop [--su3-comp-navigation-bar-focus-ring-width] - Focus indicator thickness.
 * @cssprop [--su3-comp-navigation-bar-focus-ring-offset] - Gap between the control and its focus ring.
 *
 * @fires su3-navigation-item-change - `selected` or `disabled` changed, for any reason. The
 * container listens to it to keep its value current. Internal: it does not leave the container.
 */
export class Su3NavigationItem extends LitElement {
  static override styles = navigationItemStyles;

  /** Keeps `item.focus()` working although the control is inside. */
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override properties: PropertyDeclarations = {
    value: {},
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    layout: { reflect: true },
    href: {},
    target: {},
    rel: {},
    accessibleName: { attribute: 'aria-label' },
  };

  /** The value the bar reports while this item is selected. */
  declare value: string;

  /** Whether this is the current destination. As an attribute it is the initial state. */
  declare selected: boolean;

  /** Makes the item unavailable. */
  declare disabled: boolean;

  /** Where the label sits; any value other than `inline` is the stacked layout. Set by the drawer. */
  declare layout: NavigationItemLayout;

  /** Renders a link to this address instead of a button. */
  declare href: string;

  /** Where to open the link (`_blank`, ...). Only used with `href`. */
  declare target: string;

  /** Link relationship. Only used with `href`. */
  declare rel: string;

  /** The accessible name of the control, read from the host's `aria-label`. */
  declare accessibleName: string | null;

  constructor() {
    super();
    this.value = '';
    this.selected = false;
    this.disabled = false;
    this.layout = 'stacked';
    this.href = '';
    this.target = '';
    this.rel = '';
    this.accessibleName = null;
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('selected') || changed.has('disabled')) {
      this.dispatchEvent(new Event('su3-navigation-item-change', { bubbles: true }));
    }
  }

  #onControlClick = (event: Event): void => {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  protected override render(): TemplateResult {
    const current = this.selected ? 'page' : nothing;
    const content = html`<span class="indicator" part="indicator">
        <slot name="icon"></slot>
        <span class="badge"><slot name="badge"></slot></span>
      </span>
      <span class="label" part="label"><slot></slot></span>`;

    if (this.href) {
      // An anchor without href is not a link for assistive technology, so a disabled one keeps an
      // explicit role and is left out of the tab order.
      return html`<a
        class="control"
        part="control"
        href=${this.disabled ? nothing : this.href}
        target=${this.target || nothing}
        rel=${this.rel || nothing}
        role=${this.disabled ? 'link' : nothing}
        aria-disabled=${this.disabled ? 'true' : nothing}
        aria-current=${current}
        aria-label=${this.accessibleName ?? nothing}
        @click=${this.#onControlClick}
        >${content}</a
      >`;
    }

    return html`<button
      class="control"
      part="control"
      type="button"
      ?disabled=${this.disabled}
      aria-current=${current}
      aria-label=${this.accessibleName ?? nothing}
      @click=${this.#onControlClick}
    >
      ${content}
    </button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-navigation-item': Su3NavigationItem;
  }
}
