import {
  html,
  LitElement,
  nothing,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import type { Su3NavigationItem } from '../navigation-item/navigation-item.ts';
import { navigationBarStyles } from './navigation-bar.styles.ts';

/**
 * A row of 3 to 5 equal-width `su3-navigation-item` destinations for the primary navigation of an
 * app. Exactly one item is selected (`aria-current="page"`); clicking another selects it and fires
 * `change`. The items stay in the normal tab order: this is navigation, not a radio group.
 *
 * Put the items in the default slot, give each a `value` and mark the current one with `selected`
 * (or set the bar's `value`). Name the bar with `aria-label` on the host (`aria-labelledby` cannot
 * cross the shadow boundary). The application owns routing: link items navigate by themselves, and
 * `change` tells the application which destination was chosen.
 *
 * The `--su3-comp-navigation-bar-*` hooks listed here and on `su3-navigation-item` are read by the
 * items; set them on the bar to theme all of them at once.
 *
 * @tagname su3-navigation-bar
 * @summary A row of navigation destinations with one selected.
 *
 * @slot - The `su3-navigation-item` destinations.
 *
 * @csspart nav - The `<nav>` landmark.
 *
 * @cssprop [--su3-comp-navigation-bar-container-color] - Background of the bar.
 * @cssprop [--su3-comp-navigation-bar-border-color] - Color of the line above the bar.
 * @cssprop [--su3-comp-navigation-bar-indicator-color] - Color of the selected pill.
 * @cssprop [--su3-comp-navigation-bar-label-color] - Label and icon color of unselected items.
 *
 * @fires change - The user selected another destination.
 */
export class Su3NavigationBar extends LitElement {
  static override styles = navigationBarStyles;

  static override properties: PropertyDeclarations = {
    value: {},
    accessibleName: { attribute: 'aria-label' },
  };

  /** The `value` of the selected item (an empty string when none is selected). */
  declare value: string;

  /** The accessible name of the landmark, read from the host's `aria-label`. */
  declare accessibleName: string | null;

  #initialized = false;

  constructor() {
    super();
    this.value = '';
    this.accessibleName = null;
  }

  #items(): Su3NavigationItem[] {
    return [...this.children].filter(
      (child): child is Su3NavigationItem => child.localName === 'su3-navigation-item',
    );
  }

  /** Selects the first item with this value and clears the others. */
  #setSelection(value: string): void {
    let taken = false;
    for (const item of this.#items()) {
      const match: boolean = value !== '' && item.value === value && !taken;
      item.selected = match;
      taken ||= match;
    }
    this.#syncValue();
  }

  #syncValue(): void {
    this.value = this.#items().find((item) => item.selected)?.value ?? '';
  }

  protected override willUpdate(changed: PropertyValues): void {
    // A value set from outside is applied here, so the derived value does not cost a second update.
    if (this.#initialized && changed.has('value')) this.#setSelection(this.value);
  }

  #onSlotChange = (): void => {
    if (!this.#initialized) {
      this.#initialized = true;
      // A value set before the items existed wins over their `selected` attributes.
      const preset = this.value || this.#items().find((item) => item.selected)?.value || '';
      this.#setSelection(preset);
    } else {
      this.#syncValue();
    }
  };

  /** An item's `selected` changed directly: the bar follows and keeps a single selection. */
  #onItemChange = (event: Event): void => {
    // Internal signal: it stops at the bar.
    event.stopPropagation();
    if (!this.#initialized) return;
    const item = event.target;
    if (item instanceof HTMLElement && item.localName === 'su3-navigation-item') {
      const changed = item as Su3NavigationItem;
      if (changed.selected && this.value !== changed.value) {
        this.#setSelection(changed.value);
        return;
      }
    }
    this.#syncValue();
  };

  #onClick = (event: Event): void => {
    const item = event
      .composedPath()
      .find(
        (node): node is Su3NavigationItem =>
          node instanceof Element && node.localName === 'su3-navigation-item',
      );
    if (!item || item.disabled || item.selected) return;
    this.#setSelection(item.value);
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  protected override render(): TemplateResult {
    return html`<nav
      class="nav"
      part="nav"
      aria-label=${this.accessibleName ?? nothing}
      @click=${this.#onClick}
      @su3-navigation-item-change=${this.#onItemChange}
    >
      <slot @slotchange=${this.#onSlotChange}></slot>
    </nav>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-navigation-bar': Su3NavigationBar;
  }
}
