import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit';
import { badgeStyles } from './badge.styles.ts';

/** Color treatment of the badge. */
export type BadgeTone = 'accent' | 'subtle' | 'danger' | 'neutral';

/**
 * A small status marker: slotted text, a number (`count`) or a `dot`. It is not interactive and
 * keeps the meaning of its context, so place it next to what it describes, for example inside a
 * button's label.
 *
 * A `count` above `max` is shown as `{max}+` and exposed to assistive technology as an image named
 * with the full number. A `dot` has no text and is exposed as an image named by `aria-label` on the
 * host, so always set it.
 *
 * @tagname su3-badge
 * @summary A pill with text or a count, or a dot, in four tones.
 *
 * @slot - The label, used when `count` and `dot` are not set.
 *
 * @csspart badge - The pill or dot.
 *
 * @cssprop [--su3-comp-badge-container-color] - Background color.
 * @cssprop [--su3-comp-badge-label-color] - Text color.
 * @cssprop [--su3-comp-badge-border-color] - Border color.
 * @cssprop [--su3-comp-badge-container-shape] - Corner radius.
 * @cssprop [--su3-comp-badge-height] - Height of the pill (and its minimum width).
 * @cssprop [--su3-comp-badge-padding-inline] - Horizontal padding of the pill.
 * @cssprop [--su3-comp-badge-font-size] - Label font size.
 * @cssprop [--su3-comp-badge-dot-size] - Width and height of the dot.
 */
export class Su3Badge extends LitElement {
  static override styles = badgeStyles;

  static override properties: PropertyDeclarations = {
    tone: { reflect: true },
    count: { type: Number },
    max: { type: Number },
    dot: { type: Boolean, reflect: true },
    accessibleName: { attribute: 'aria-label' },
  };

  /** Color treatment. */
  declare tone: BadgeTone;

  /** A number to show instead of the slotted text. It is shown as given, so pass a non-negative integer. */
  declare count: number | undefined;

  /** The largest number shown as is; a larger `count` is shown as `{max}+`. */
  declare max: number;

  /** Shows a small dot with no text. Set `aria-label` to describe it. */
  declare dot: boolean;

  /** The accessible name of a dot, from the host's `aria-label`. */
  declare accessibleName: string | null;

  constructor() {
    super();
    this.tone = 'accent';
    this.count = undefined;
    this.max = 99;
    this.dot = false;
    this.accessibleName = null;
  }

  protected override render(): TemplateResult {
    if (this.dot) {
      return html`<span
        class="badge dot"
        part="badge"
        role="img"
        aria-label=${this.accessibleName ?? nothing}
      ></span>`;
    }
    if (this.count !== undefined) {
      const truncated = this.count > this.max;
      return html`<span
        class="badge"
        part="badge"
        role=${truncated ? 'img' : nothing}
        aria-label=${truncated ? String(this.count) : nothing}
        >${truncated ? `${String(this.max)}+` : String(this.count)}</span
      >`;
    }
    return html`<span class="badge" part="badge"><slot></slot></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-badge': Su3Badge;
  }
}
