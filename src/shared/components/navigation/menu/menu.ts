import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit';
import type { PopupPlacement } from '../../../behaviors/popup-position.ts';
import { PopupController } from '../../../behaviors/popup-controller.ts';
import { Typeahead } from '../../../behaviors/typeahead.ts';
import type { Su3MenuItem } from '../menu-item/menu-item.ts';
import { menuStyles } from './menu.styles.ts';

/** Where the menu opens relative to its trigger; it flips vertically when it does not fit. */
export type MenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

/** Why a menu closed. */
export type MenuCloseReason = 'select' | 'escape' | 'outside' | 'tab' | 'trigger';

/** Detail of the `select` event. */
export interface MenuSelectDetail {
  /** The activated item. */
  item: Su3MenuItem;
  /** The item's `value`. */
  value: string;
}

/** Detail of the `close` event. */
export interface MenuCloseDetail {
  /** Why the menu closed. */
  reason: MenuCloseReason;
}

/**
 * A popup list of commands that opens from a trigger. Put the control that opens it in the
 * `trigger` slot and `su3-menu-item` elements in the default slot (other children, such as a
 * `su3-divider`, are skipped by the keyboard). A click on the trigger toggles the menu; ArrowDown
 * and ArrowUp on the trigger open it with the first or last item focused. Inside, the arrow keys
 * move with wrap-around, Home and End jump, typing letters moves to the next item whose label
 * starts with them, Enter and Space activate, Escape and Tab close it. A press outside closes it
 * too. Disabled items are skipped.
 *
 * Activating an item fires `select`, toggles a `checkable` item and closes the menu; focus then
 * returns to the trigger. The menu describes its trigger with `aria-haspopup` and `aria-expanded`
 * (forwarded to the inner control by `su3-button` and `su3-icon-button`). The popup is placed below
 * the trigger by default and flips above it, and stays inside the viewport. Name the menu with
 * `aria-label` on the host when its purpose is not clear from the trigger. Setting `open` to
 * `false` from outside fires no event. A menu that is removed from the document closes, because the
 * browser hides its popup.
 *
 * @tagname su3-menu
 * @summary A popup list of commands that opens from a trigger.
 *
 * @slot trigger - The control that opens the menu.
 * @slot - The `su3-menu-item` elements and separators.
 *
 * @csspart surface - The popup.
 *
 * @cssprop [--su3-comp-menu-container-color] - Background of the popup.
 * @cssprop [--su3-comp-menu-container-shape] - Corner radius.
 * @cssprop [--su3-comp-menu-elevation] - Box shadow.
 * @cssprop [--su3-comp-menu-min-width] - Minimum width of the popup.
 * @cssprop [--su3-comp-menu-offset] - Gap between the trigger and the popup.
 *
 * @fires select - The user activated an item (`detail.item`, `detail.value`).
 * @fires close - The menu closed because of the user (`detail.reason` is `select`, `escape`,
 * `outside`, `tab` or `trigger`). Both bubble but are not composed.
 */
export class Su3Menu extends LitElement {
  static override styles = menuStyles;

  static override properties: PropertyDeclarations = {
    open: { type: Boolean, reflect: true },
    placement: { type: String, reflect: true },
    accessibleName: { attribute: 'aria-label' },
  };

  /** Shows the menu. */
  declare open: boolean;

  /** The preferred side and alignment. */
  declare placement: MenuPlacement;

  /** The accessible name of the popup, read from the host's `aria-label`. */
  declare accessibleName: string | null;

  /** Which item takes focus when the menu opens. */
  #entry: 'first' | 'last' = 'first';
  readonly #typeahead = new Typeahead();
  readonly #popup: PopupController = new PopupController(this, {
    surface: (): HTMLElement | null => this.#surface(),
    anchor: (): Element => this.#trigger() ?? this,
    placement: (): PopupPlacement => {
      const [side, align] = this.placement.split('-');
      return { side: side === 'top' ? 'top' : 'bottom', align: align === 'end' ? 'end' : 'start' };
    },
    onOutsidePress: () => {
      this.#close('outside');
    },
  });

  constructor() {
    super();
    this.open = false;
    this.placement = 'bottom-start';
    this.accessibleName = null;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#typeahead.clear();
    // Removing the element hides the popup, so the state follows it.
    this.open = false;
  }

  protected override updated(): void {
    this.#syncTrigger();
    if (this.#popup.sync(this.open)) this.#focusEntry();
  }

  #surface(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>('.surface');
  }

  #trigger(): HTMLElement | null {
    return this.querySelector<HTMLElement>(':scope > [slot="trigger"]');
  }

  /** The `su3-menu-item` children, in document order. */
  #items(): Su3MenuItem[] {
    return [...this.children].filter(
      (child): child is Su3MenuItem => child.localName === 'su3-menu-item',
    );
  }

  #enabled(): Su3MenuItem[] {
    return this.#items().filter((item) => !item.disabled);
  }

  #syncTrigger(): void {
    const trigger = this.#trigger();
    if (!trigger) return;
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', String(this.open));
  }

  #focusEntry(): void {
    // The first render can open the menu before the slot has reported its items.
    for (const item of this.#items()) item.tabIndex = -1;
    const items = this.#enabled();
    const target = this.#entry === 'last' ? items[items.length - 1] : items[0];
    target?.focus();
  }

  #close(reason: MenuCloseReason): void {
    if (!this.open) return;
    this.open = false;
    // Focus goes back to the trigger unless the user moved on by pressing somewhere else.
    if (reason !== 'outside') this.#trigger()?.focus();
    this.dispatchEvent(
      new CustomEvent<MenuCloseDetail>('close', { detail: { reason }, bubbles: true }),
    );
  }

  #activate(item: Su3MenuItem): void {
    if (item.disabled) return;
    if (item.checkable) item.checked = !item.checked;
    this.dispatchEvent(
      new CustomEvent<MenuSelectDetail>('select', {
        detail: { item, value: item.value },
        bubbles: true,
      }),
    );
    this.#close('select');
  }

  #openFrom(entry: 'first' | 'last'): void {
    this.#entry = entry;
    this.open = true;
  }

  #onTriggerClick = (): void => {
    if (this.open) this.#close('trigger');
    else this.#openFrom('first');
  };

  #onTriggerKeyDown = (event: KeyboardEvent): void => {
    if (this.open) {
      // Focus stays on the trigger when no item can take it (all disabled): Escape still closes.
      if (event.key === 'Escape') this.#close('escape');
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.#openFrom(event.key === 'ArrowDown' ? 'first' : 'last');
    }
  };

  #onItemsSlotChange = (): void => {
    // Roving focus: every item is focusable by script only, the menu moves focus between them.
    for (const item of this.#items()) item.tabIndex = -1;
  };

  #onSurfaceClick = (event: Event): void => {
    const item = event
      .composedPath()
      .find(
        (node): node is Su3MenuItem =>
          node instanceof Element && node.localName === 'su3-menu-item',
      );
    if (item) this.#activate(item);
  };

  #onSurfaceKeyDown = (event: KeyboardEvent): void => {
    const items = this.#enabled();
    const current = items.findIndex((item) => item === event.target);
    const move = (index: number): void => {
      event.preventDefault();
      items[(index + items.length) % items.length]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        move(current + 1);
        return;
      case 'ArrowUp':
        move(current < 0 ? -1 : current - 1);
        return;
      case 'Home':
        move(0);
        return;
      case 'End':
        move(-1);
        return;
      case 'Escape':
        event.preventDefault();
        this.#close('escape');
        return;
      case 'Tab':
        // No preventDefault: focus returns to the trigger and Tab then moves on from there.
        this.#close('tab');
        return;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const item = items[current];
        if (item) this.#activate(item);
        return;
      }
      default:
        if (Typeahead.isPrintable(event)) {
          items[this.#typeahead.find(event.key, items.map(labelOf), current)]?.focus();
        }
    }
  };

  protected override render(): TemplateResult {
    return html`<slot
        name="trigger"
        @click=${this.#onTriggerClick}
        @keydown=${this.#onTriggerKeyDown}
        @slotchange=${() => {
          this.#syncTrigger();
        }}
      ></slot>
      <div
        class="surface"
        part="surface"
        role="menu"
        popover="manual"
        aria-label=${this.accessibleName ?? nothing}
        @click=${this.#onSurfaceClick}
        @keydown=${this.#onSurfaceKeyDown}
      >
        <slot @slotchange=${this.#onItemsSlotChange}></slot>
      </div>`;
  }
}

/** The text of an item's own label, without its `leading` and `trailing` content. */
function labelOf(item: Su3MenuItem): string {
  return [...item.childNodes]
    .filter((node) => !(node instanceof Element) || !node.hasAttribute('slot'))
    .map((node) => node.textContent)
    .join('')
    .trim()
    .toLowerCase();
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-menu': Su3Menu;
  }
}
