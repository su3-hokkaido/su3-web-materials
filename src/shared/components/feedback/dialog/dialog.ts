import { html, nothing, LitElement, type PropertyDeclarations, type TemplateResult } from 'lit';
import { dialogStyles } from './dialog.styles.ts';

/** Why a dialog closed: Escape, a click on the scrim or an element with `dialog-action`. */
export type DialogCloseReason = 'escape' | 'scrim' | 'action';

/** Detail of the `close` event. */
export interface DialogCloseDetail {
  /** Why the dialog closed. */
  reason: DialogCloseReason;
  /** The value of the `dialog-action` attribute of the activated element, for `action`. */
  action?: string;
}

/**
 * A modal dialog: a panel over the page with a scrim, a headline, content and actions. It uses a
 * native `<dialog>`, so it is shown in the top layer, traps focus, closes on Escape and returns
 * focus to the element that opened it.
 *
 * Put the title in the `headline` slot (plain text, the dialog wraps it in an `h2` and names itself
 * by it), the content in the default slot and buttons in the `actions` slot. An element in the
 * `actions` slot with a `dialog-action` attribute closes the dialog when it is clicked, and the
 * attribute's value is reported as `detail.action`. `open` shows the dialog. With `persistent`,
 * Escape and a click on the scrim do nothing, so the user has to choose an action. `alert` gives it
 * the `alertdialog` role. `fullscreen` fills the viewport; the application decides when. Without a
 * headline, name the dialog with `aria-label` on the host. Give an element in the content
 * `autofocus` to choose what takes focus on open. Setting `open` to `false` from outside fires no
 * event.
 *
 * @tagname su3-dialog
 * @summary A modal dialog with a headline, content and actions.
 *
 * @slot headline - The title.
 * @slot - The content.
 * @slot actions - Buttons; an element with `dialog-action` closes the dialog when clicked.
 *
 * @csspart dialog - The native `<dialog>` element (the surface).
 * @csspart headline - The wrapper around the headline slot.
 * @csspart content - The scrolling wrapper around the content slot.
 * @csspart actions - The wrapper around the actions slot.
 *
 * @cssprop [--su3-comp-dialog-container-color] - Background of the dialog.
 * @cssprop [--su3-comp-dialog-scrim-color] - Color of the scrim.
 * @cssprop [--su3-comp-dialog-container-shape] - Corner radius.
 * @cssprop [--su3-comp-dialog-max-width] - Maximum width of the dialog.
 * @cssprop [--su3-comp-dialog-elevation] - Box shadow.
 * @cssprop [--su3-comp-dialog-headline-color] - Headline color.
 *
 * @fires close - The dialog closed because of the user (`detail.reason` is `escape`, `scrim` or
 * `action`; `detail.action` carries the `dialog-action` value). A close by the browser itself is
 * reported as `escape`. It bubbles but is not composed.
 */
export class Su3Dialog extends LitElement {
  static override styles = dialogStyles;

  static override properties: PropertyDeclarations = {
    open: { type: Boolean, reflect: true },
    persistent: { type: Boolean, reflect: true },
    alert: { type: Boolean, reflect: true },
    fullscreen: { type: Boolean, reflect: true },
    accessibleName: { attribute: 'aria-label' },
    hasHeadline: { state: true },
    hasActions: { state: true },
  };

  /** Shows the dialog. */
  declare open: boolean;

  /** Makes Escape and a click on the scrim do nothing. */
  declare persistent: boolean;

  /** Gives the dialog the `alertdialog` role, for a message that needs an answer. */
  declare alert: boolean;

  /** Fills the viewport. */
  declare fullscreen: boolean;

  /** The accessible name when there is no headline, read from the host's `aria-label`. */
  declare accessibleName: string | null;

  declare private hasHeadline: boolean;
  declare private hasActions: boolean;

  constructor() {
    super();
    this.open = false;
    this.persistent = false;
    this.alert = false;
    this.fullscreen = false;
    this.accessibleName = null;
    this.hasHeadline = false;
    this.hasActions = false;
  }

  #dialog(): HTMLDialogElement | null {
    return this.renderRoot.querySelector('dialog');
  }

  protected override updated(): void {
    const dialog = this.#dialog();
    if (!dialog) return;
    if (this.open && !dialog.open) {
      dialog.showModal();
      // A chosen element wins over the browser's first focusable one. A Lit element may not have
      // rendered its control yet on the first render, so it is awaited.
      const chosen = this.querySelector<HTMLElement>('[autofocus]');
      if (chosen) {
        const ready = chosen instanceof LitElement ? chosen.updateComplete : Promise.resolve(true);
        void ready.then(() => {
          if (this.open) chosen.focus();
        });
      }
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  #closeBecause(detail: DialogCloseDetail): void {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new CustomEvent<DialogCloseDetail>('close', { detail, bubbles: true }));
  }

  #onCancel = (event: Event): void => {
    // Escape: the element closes the dialog itself, from `updated`, so there is one path.
    event.preventDefault();
    if (!this.persistent) this.#closeBecause({ reason: 'escape' });
  };

  #onNativeClose = (): void => {
    // The browser can close the dialog without a cancelable `cancel` (for example a second Escape
    // without a user action in between): keep `open` in step. Our own close finds `open` unset.
    this.#closeBecause({ reason: 'escape' });
  };

  #onDialogClick = (event: Event): void => {
    // The panel fills the dialog, so only a click on the scrim has the dialog itself as its target.
    if (event.target === event.currentTarget && !this.persistent) {
      this.#closeBecause({ reason: 'scrim' });
    }
  };

  #onActionsClick = (event: Event): void => {
    const control = event
      .composedPath()
      .find(
        (node): node is Element => node instanceof Element && node.hasAttribute('dialog-action'),
      );
    if (!control || control.matches('[disabled], [aria-disabled="true"]')) return;
    this.#closeBecause({ reason: 'action', action: control.getAttribute('dialog-action') ?? '' });
  };

  #onHeadlineSlotChange = (event: Event): void => {
    const slot = event.target;
    this.hasHeadline = slot instanceof HTMLSlotElement && slot.assignedNodes().length > 0;
  };

  #onActionsSlotChange = (event: Event): void => {
    const slot = event.target;
    this.hasActions = slot instanceof HTMLSlotElement && slot.assignedNodes().length > 0;
  };

  protected override render(): TemplateResult {
    return html`<dialog
      class="dialog"
      part="dialog"
      role=${this.alert ? 'alertdialog' : nothing}
      aria-labelledby=${this.hasHeadline ? 'headline' : nothing}
      aria-label=${this.hasHeadline ? nothing : (this.accessibleName ?? nothing)}
      @cancel=${this.#onCancel}
      @close=${this.#onNativeClose}
      @click=${this.#onDialogClick}
    >
      <div class="panel">
        <h2
          class=${this.hasHeadline ? 'headline filled' : 'headline'}
          id="headline"
          part="headline"
        >
          <slot name="headline" @slotchange=${this.#onHeadlineSlotChange}></slot>
        </h2>
        <div class="content" part="content"><slot></slot></div>
        <div
          class=${this.hasActions ? 'actions filled' : 'actions'}
          part="actions"
          @click=${this.#onActionsClick}
        >
          <slot name="actions" @slotchange=${this.#onActionsSlotChange}></slot>
        </div>
      </div>
    </dialog>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-dialog': Su3Dialog;
  }
}
