import { html, nothing, type PropertyDeclarations, type TemplateResult } from 'lit';
import { NavigationSelectionElement } from '../../../behaviors/navigation-selection.ts';
import { navigationRailStyles } from './navigation-rail.styles.ts';

/**
 * A vertical column of `su3-navigation-item` destinations for the primary navigation of an app on
 * wider screens, with an optional `header` slot above them. It is the vertical counterpart of
 * `su3-navigation-bar`: exactly one item is selected (`aria-current="page"`); clicking another
 * selects it and fires `change`. The items stay in the normal tab order: this is navigation, not a
 * radio group.
 *
 * Put the items in the default slot, give each a `value` and mark the current one with `selected`
 * (or set the rail's `value`). Name the rail with `aria-label` on the host (`aria-labelledby` cannot
 * cross the shadow boundary). The application owns routing: link items navigate by themselves, and
 * `change` tells the application which destination was chosen. Which of bar and rail to show at a
 * given width is the application's choice.
 *
 * The items read the `--su3-comp-navigation-bar-*` hooks listed on `su3-navigation-item`; set them
 * on the rail to theme the items, so one theme works for both containers.
 *
 * @tagname su3-navigation-rail
 * @summary A column of navigation destinations with one selected.
 *
 * @slot - The `su3-navigation-item` destinations.
 * @slot header - Optional content above the items, such as a menu button or a primary action.
 *
 * @csspart nav - The `<nav>` landmark.
 * @csspart header - The wrapper around the header slot.
 *
 * @cssprop [--su3-comp-navigation-rail-container-color] - Background of the rail.
 * @cssprop [--su3-comp-navigation-rail-border-color] - Color of the line beside the rail.
 * @cssprop [--su3-comp-navigation-rail-width] - Width of the rail.
 * @cssprop [--su3-comp-navigation-rail-item-gap] - Space between items.
 *
 * @fires change - The user selected another destination.
 */
export class Su3NavigationRail extends NavigationSelectionElement {
  static override styles = navigationRailStyles;

  static override properties: PropertyDeclarations = {
    hasHeader: { state: true },
  };

  declare private hasHeader: boolean;

  constructor() {
    super();
    this.hasHeader = false;
  }

  #onHeaderSlotChange = (event: Event): void => {
    const slot = event.target;
    this.hasHeader = slot instanceof HTMLSlotElement && slot.assignedNodes().length > 0;
  };

  protected override render(): TemplateResult {
    return html`<nav
      class="nav"
      part="nav"
      aria-label=${this.accessibleName ?? nothing}
      @click=${this.onClick}
      @su3-navigation-item-change=${this.onItemChange}
    >
      <div class=${this.hasHeader ? 'header filled' : 'header'} part="header">
        <slot name="header" @slotchange=${this.#onHeaderSlotChange}></slot>
      </div>
      <div class="items"><slot @slotchange=${this.onSlotChange}></slot></div>
    </nav>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-navigation-rail': Su3NavigationRail;
  }
}
