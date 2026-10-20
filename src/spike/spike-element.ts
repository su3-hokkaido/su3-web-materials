import { css, html, LitElement } from 'lit';

/**
 * Throwaway element for the decorator spike (docs/2026-10-20_01_phase1-foundation/design.md).
 *
 * @summary Verifies that decorator-free Lit works with the whole toolchain.
 * @slot - Label content.
 * @csspart button - The inner button.
 * @fires spike-click - Fired when the inner button is clicked.
 */
export class Su3Spike extends LitElement {
  static override properties = {
    variant: { reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles = css`
    button {
      color: var(--su3-sys-color-text, #151c1f);
    }
  `;

  /** Visual style. */
  declare variant: 'a' | 'b';

  /** Whether the button is disabled. */
  declare disabled: boolean;

  constructor() {
    super();
    this.variant = 'a';
    this.disabled = false;
  }

  protected override render() {
    return html`<button part="button" ?disabled=${this.disabled} @click=${this.#onClick}>
      <slot></slot>
    </button>`;
  }

  #onClick() {
    this.dispatchEvent(new CustomEvent('spike-click', { bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-spike': Su3Spike;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('su3-spike')) {
  customElements.define('su3-spike', Su3Spike);
}
