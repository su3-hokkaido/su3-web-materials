import { html, nothing, type TemplateResult } from 'lit';
import { NavigationSelectionElement } from '../../../behaviors/navigation-selection.ts';
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
export class Su3NavigationBar extends NavigationSelectionElement {
  static override styles = navigationBarStyles;

  protected override render(): TemplateResult {
    return html`<nav
      class="nav"
      part="nav"
      aria-label=${this.accessibleName ?? nothing}
      @click=${this.onClick}
      @su3-navigation-item-change=${this.onItemChange}
    >
      <slot @slotchange=${this.onSlotChange}></slot>
    </nav>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-navigation-bar': Su3NavigationBar;
  }
}
