import { LitElement, type PropertyDeclarations, type PropertyValues } from 'lit';
import type { Su3NavigationItem } from '../components/navigation/navigation-item/navigation-item.ts';

/**
 * Base class for the navigation containers (bar, rail, drawer). It owns the single selection over
 * the `su3-navigation-item` children: `value` is derived from the selected item, a `value` set from
 * outside selects the matching item, and a click on an available, unselected item selects it and
 * fires `change`. The items stay in the normal tab order: this is navigation, not a radio group.
 *
 * The subclass renders a `<nav>` and wires the protected handlers: `onSlotChange` on the slot that
 * holds the items, `onItemChange` on `su3-navigation-item-change` and `onClick` on click, all on
 * the `<nav>` or its slot. Only direct children take part in the selection, so other children (a
 * heading, a header) are ignored.
 *
 * @fires change - The user selected another destination.
 */
export abstract class NavigationSelectionElement extends LitElement {
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

  /** The `su3-navigation-item` children, in document order. */
  protected items(): Su3NavigationItem[] {
    return [...this.children].filter(
      (child): child is Su3NavigationItem => child.localName === 'su3-navigation-item',
    );
  }

  /** Selects the first item with this value and clears the others. */
  protected setSelection(value: string): void {
    let taken = false;
    for (const item of this.items()) {
      const match: boolean = value !== '' && item.value === value && !taken;
      item.selected = match;
      taken ||= match;
    }
    this.syncValue();
  }

  protected syncValue(): void {
    this.value = this.items().find((item) => item.selected)?.value ?? '';
  }

  protected override willUpdate(changed: PropertyValues): void {
    // A value set from outside is applied here, so the derived value does not cost a second update.
    if (this.#initialized && changed.has('value')) this.setSelection(this.value);
  }

  protected readonly onSlotChange = (): void => {
    if (!this.#initialized) {
      this.#initialized = true;
      // A value set before the items existed wins over their `selected` attributes.
      const preset = this.value || this.items().find((item) => item.selected)?.value || '';
      this.setSelection(preset);
    } else {
      this.syncValue();
    }
  };

  /** An item's `selected` changed directly: the container follows and keeps a single selection. */
  protected readonly onItemChange = (event: Event): void => {
    // Internal signal: it stops at the container.
    event.stopPropagation();
    if (!this.#initialized) return;
    const changed = this.items().find((item) => item === event.target);
    if (changed?.selected && this.value !== changed.value) {
      this.setSelection(changed.value);
      return;
    }
    this.syncValue();
  };

  protected readonly onClick = (event: Event): void => {
    const item = event
      .composedPath()
      .find(
        (node): node is Su3NavigationItem =>
          node instanceof Element && node.localName === 'su3-navigation-item',
      );
    if (!item || item.disabled || item.selected) return;
    this.setSelection(item.value);
    this.dispatchEvent(new Event('change', { bubbles: true }));
    this.afterUserSelection();
  };

  /** Called after a click selected an item and `change` fired. */
  protected afterUserSelection(): void {}
}
