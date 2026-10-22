import {
  html,
  LitElement,
  nothing,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { snackbarStyles } from './snackbar.styles.ts';

/** Why a snackbar closed: its timer ran out, the user dismissed it or used the action. */
export type SnackbarCloseReason = 'timeout' | 'dismiss' | 'action';

/** Detail of the `close` event. */
export interface SnackbarCloseDetail {
  /** Why the snackbar closed. */
  reason: SnackbarCloseReason;
}

/**
 * A short, transient message at the bottom of the viewport, with an optional action and an optional
 * close button. It is shown while `open` is set, in the top layer (Popover API), and announced
 * politely through a status live region without taking focus.
 *
 * The snackbar closes itself after `duration` milliseconds and fires `close`; the timer pauses while
 * the pointer is over it or focus is inside it, so the action stays reachable. `duration="0"` keeps
 * it open until the user or the application closes it. Setting `open` to `false` from outside fires
 * no event. Queueing several messages is the application's job.
 *
 * Put the message in the default slot and an action in the `action` slot, for example a
 * `su3-button` with `variant="text"`; activating the action closes the snackbar. Reopening one
 * snackbar with different text is announced again by assistive technology.
 *
 * @tagname su3-snackbar
 * @summary A transient message with an optional action.
 *
 * @slot - The message.
 * @slot action - An action, usually a text button.
 *
 * @csspart surface - The message surface.
 * @csspart message - The wrapper around the default slot.
 * @csspart dismiss - The close button.
 *
 * @cssprop [--su3-comp-snackbar-container-color] - Background of the surface.
 * @cssprop [--su3-comp-snackbar-label-color] - Message color.
 * @cssprop [--su3-comp-snackbar-action-color] - Color of text buttons in the action slot.
 * @cssprop [--su3-comp-snackbar-container-shape] - Corner radius.
 * @cssprop [--su3-comp-snackbar-max-width] - Maximum width of the surface.
 * @cssprop [--su3-comp-snackbar-offset] - Distance from the bottom edge of the viewport.
 * @cssprop [--su3-comp-snackbar-elevation] - Box shadow.
 * @cssprop [--su3-comp-snackbar-focus-ring-color] - Focus indicator color.
 * @cssprop [--su3-comp-snackbar-focus-ring-width] - Focus indicator thickness.
 * @cssprop [--su3-comp-snackbar-focus-ring-offset] - Gap between a control and its focus ring.
 *
 * @fires close - The snackbar closed because of a timeout or the user (`detail.reason` is
 * `timeout`, `dismiss` or `action`). It bubbles but is not composed. Escape while focus is inside
 * the snackbar dismisses it.
 */
export class Su3Snackbar extends LitElement {
  static override styles = snackbarStyles;

  static override properties: PropertyDeclarations = {
    open: { type: Boolean, reflect: true },
    duration: { type: Number },
    dismissible: { type: Boolean, reflect: true },
    closeLabel: { attribute: 'close-label' },
  };

  /** Shows the snackbar. */
  declare open: boolean;

  /** Milliseconds until it closes itself; `0` keeps it open. */
  declare duration: number;

  /** Shows a close button. */
  declare dismissible: boolean;

  /** Accessible name of the close button. */
  declare closeLabel: string;

  #timer: ReturnType<typeof setTimeout> | undefined;
  #hovered = false;
  #focused = false;

  constructor() {
    super();
    this.open = false;
    this.duration = 4000;
    this.dismissible = false;
    this.closeLabel = 'Close';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Reconnecting an open snackbar restores the top layer and the timer.
    if (this.hasUpdated && this.open) {
      this.#syncPopover();
      this.#startTimer();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#stopTimer();
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('open')) this.#syncPopover();
    if (changed.has('open') || changed.has('duration')) {
      this.#hovered = false;
      this.#focused = false;
      this.#startTimer();
    }
  }

  #surface(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>('.surface');
  }

  /** Puts the surface in the top layer where the Popover API exists. */
  #syncPopover(): void {
    const surface = this.#surface();
    if (!surface || typeof surface.showPopover !== 'function') return;
    const shown = surface.matches(':popover-open');
    if (this.open && !shown) surface.showPopover();
    else if (!this.open && shown) surface.hidePopover();
  }

  #startTimer(): void {
    this.#stopTimer();
    if (!this.open || !(this.duration > 0) || this.#hovered || this.#focused) return;
    this.#timer = setTimeout(() => {
      this.#close('timeout');
    }, this.duration);
  }

  #stopTimer(): void {
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  #close(reason: SnackbarCloseReason): void {
    if (!this.open) return;
    this.#stopTimer();
    this.open = false;
    this.dispatchEvent(
      new CustomEvent<SnackbarCloseDetail>('close', { detail: { reason }, bubbles: true }),
    );
  }

  #onPointerEnter = (): void => {
    this.#hovered = true;
    this.#stopTimer();
  };

  #onPointerLeave = (): void => {
    this.#hovered = false;
    this.#startTimer();
  };

  #onFocusIn = (): void => {
    this.#focused = true;
    this.#stopTimer();
  };

  #onFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget;
    if (next instanceof Node && this.contains(next)) return;
    this.#focused = false;
    this.#startTimer();
  };

  #onActionClick = (event: Event): void => {
    // Ignore clicks on the empty wrapper, on disabled controls and on non-interactive content.
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.slot !== 'action') return;
    if (target.matches('[disabled], [aria-disabled="true"]')) return;
    this.#close('action');
  };

  #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.#close('dismiss');
  };

  protected override render(): TemplateResult {
    return html`<div class=${this.open ? 'live open' : 'live'} role="status">
      <div
        class="surface"
        part="surface"
        popover="manual"
        @pointerenter=${this.#onPointerEnter}
        @pointerleave=${this.#onPointerLeave}
        @focusin=${this.#onFocusIn}
        @focusout=${this.#onFocusOut}
        @keydown=${this.#onKeyDown}
      >
        <span class="message" part="message"><slot></slot></span>
        <span class="action" @click=${this.#onActionClick}><slot name="action"></slot></span>
        ${
          this.dismissible
            ? html`<button
                class="dismiss"
                part="dismiss"
                type="button"
                aria-label=${this.closeLabel}
                @click=${() => {
                  this.#close('dismiss');
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>`
            : nothing
        }
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-snackbar': Su3Snackbar;
  }
}
