import { html, nothing, type PropertyDeclarations, type TemplateResult } from 'lit';
import { NavigationSelectionElement } from '../../../behaviors/navigation-selection.ts';
import { navigationDrawerStyles } from './navigation-drawer.styles.ts';

/** Why a modal drawer closed: Escape, a click on the scrim or a selection with `close-on-select`. */
export type NavigationDrawerCloseReason = 'escape' | 'scrim' | 'select';

/** Detail of the `close` event. */
export interface NavigationDrawerCloseDetail {
  /** Why the drawer closed. */
  reason: NavigationDrawerCloseReason;
}

/**
 * A panel of `su3-navigation-item` destinations with the label beside the icon, an optional
 * `header` slot and optional section headings. It has the selection model of `su3-navigation-bar`
 * and `su3-navigation-rail`: exactly one item is selected (`aria-current="page"`); clicking another
 * selects it and fires `change`. The items stay in the normal tab order.
 *
 * By default the drawer is standard: always visible and part of the layout. With `modal` it becomes
 * a panel over the page with a scrim, in a native `<dialog>`: `open` shows it, focus moves to the
 * selected item (or the first available one) and returns to the opener when it closes, Escape and a
 * click on the scrim close it, and `close-on-select` also closes it when the user picks a
 * destination. `open` has no effect on a standard drawer. Closing fires `close` with
 * `detail.reason`; setting `open` to `false` from outside fires no event. Which mode to use at a
 * given width is the application's choice.
 *
 * Put the items in the default slot. Section headings are plain `h2`, `h3` or `h4` elements placed
 * between the items; they are styled by the drawer and are not part of the selection. Name the
 * drawer with `aria-label` on the host (`aria-labelledby` cannot cross the shadow boundary). The
 * application owns routing: link items navigate by themselves, and `change` tells the application
 * which destination was chosen.
 *
 * The items read the `--su3-comp-navigation-bar-*` hooks listed on `su3-navigation-item`; set them
 * on the drawer to theme the items, so one theme works for all three containers.
 *
 * @tagname su3-navigation-drawer
 * @summary A panel of navigation destinations, standard or modal.
 *
 * @slot - The `su3-navigation-item` destinations and optional `h2`, `h3` or `h4` section headings.
 * @slot header - Optional content above the items, such as a title or a logo.
 *
 * @csspart nav - The `<nav>` landmark.
 * @csspart header - The wrapper around the header slot.
 * @csspart dialog - The `<dialog>` of a modal drawer.
 *
 * @cssprop [--su3-comp-navigation-drawer-container-color] - Background of the drawer.
 * @cssprop [--su3-comp-navigation-drawer-border-color] - Color of the line beside a standard drawer.
 * @cssprop [--su3-comp-navigation-drawer-width] - Width of the drawer.
 * @cssprop [--su3-comp-navigation-drawer-scrim-color] - Color of the scrim behind a modal drawer.
 * @cssprop [--su3-comp-navigation-drawer-shape] - Radius of the outer corners of a modal drawer.
 * @cssprop [--su3-comp-navigation-drawer-elevation] - Box shadow of a modal drawer.
 * @cssprop [--su3-comp-navigation-drawer-heading-color] - Color of section headings.
 *
 * @fires change - The user selected another destination.
 * @fires close - A modal drawer closed because of the user (`detail.reason` is `escape`, `scrim` or
 * `select`). It bubbles but is not composed.
 */
export class Su3NavigationDrawer extends NavigationSelectionElement {
  static override styles = navigationDrawerStyles;

  static override properties: PropertyDeclarations = {
    modal: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
    closeOnSelect: { type: Boolean, attribute: 'close-on-select' },
    hasHeader: { state: true },
  };

  /** Shows the drawer as a panel over the page, with a scrim, instead of part of the layout. */
  declare modal: boolean;

  /** Whether a modal drawer is shown. Ignored when the drawer is not modal. */
  declare open: boolean;

  /** Closes a modal drawer when the user selects a destination. */
  declare closeOnSelect: boolean;

  declare private hasHeader: boolean;

  constructor() {
    super();
    this.modal = false;
    this.open = false;
    this.closeOnSelect = false;
    this.hasHeader = false;
  }

  #dialog(): HTMLDialogElement | null {
    return this.renderRoot.querySelector('dialog');
  }

  protected override updated(): void {
    const dialog = this.#dialog();
    if (!dialog) return;
    if (this.open && !dialog.open) {
      dialog.showModal();
      this.#focusEntry();
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  /** The selected item, or else the first available one, takes focus when the drawer opens. */
  #focusEntry(): void {
    const items = this.items().filter((item) => !item.disabled);
    const entry = items.find((item) => item.selected) ?? items[0];
    // On the first render the item may not have rendered its control yet.
    void entry?.updateComplete.then(() => {
      if (this.open) entry.focus();
    });
  }

  #closeBecause(reason: NavigationDrawerCloseReason): void {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(
      new CustomEvent<NavigationDrawerCloseDetail>('close', { detail: { reason }, bubbles: true }),
    );
  }

  protected override afterUserSelection(): void {
    if (this.modal && this.closeOnSelect) this.#closeBecause('select');
  }

  #onCancel = (event: Event): void => {
    // Escape: the drawer closes the dialog itself, from `updated`, so there is one path.
    event.preventDefault();
    this.#closeBecause('escape');
  };

  #onDialogClose = (): void => {
    // The browser can close the dialog without a cancelable `cancel` (for example a second Escape
    // without a user action in between): keep `open` in step. Our own close finds `open` unset.
    this.#closeBecause('escape');
  };

  #onDialogClick = (event: Event): void => {
    // Only the dialog box itself is hit by a click on the scrim; the content fills it.
    if (event.target === event.currentTarget) this.#closeBecause('scrim');
  };

  #onItemsSlotChange = (): void => {
    for (const item of this.items()) item.layout = 'inline';
    this.onSlotChange();
  };

  #onHeaderSlotChange = (event: Event): void => {
    const slot = event.target;
    this.hasHeader = slot instanceof HTMLSlotElement && slot.assignedNodes().length > 0;
  };

  /** In modal mode the dialog carries the name, so the landmark is not announced twice. */
  #renderNav(named: boolean): TemplateResult {
    return html`<nav
      class="nav"
      part="nav"
      aria-label=${named ? (this.accessibleName ?? nothing) : nothing}
      @click=${this.onClick}
      @su3-navigation-item-change=${this.onItemChange}
    >
      <div class=${this.hasHeader ? 'header filled' : 'header'} part="header">
        <slot name="header" @slotchange=${this.#onHeaderSlotChange}></slot>
      </div>
      <div class="items"><slot @slotchange=${this.#onItemsSlotChange}></slot></div>
    </nav>`;
  }

  protected override render(): TemplateResult {
    if (!this.modal) return this.#renderNav(true);
    return html`<dialog
      class="dialog"
      part="dialog"
      aria-label=${this.accessibleName ?? nothing}
      @cancel=${this.#onCancel}
      @close=${this.#onDialogClose}
      @click=${this.#onDialogClick}
    >
      ${this.#renderNav(false)}
    </dialog>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-navigation-drawer': Su3NavigationDrawer;
  }
}
