import { html, LitElement, type PropertyDeclarations, type TemplateResult } from 'lit';
import { cardStyles } from './card.styles.ts';

/** Visual style of the container. */
export type CardVariant = 'elevated' | 'filled' | 'outlined';

/**
 * A surface that groups related content. It is a plain container: it has no role, takes no focus
 * and handles no clicks, so what it holds keeps its own semantics. Put actions in the `actions`
 * slot as `su3-button` elements or links; a card that is itself a link is not supported.
 *
 * The `media` slot is full-bleed (no padding, clipped by the card's corners), `header` and the
 * default slot are padded, and `actions` is a row at the end that wraps on narrow widths. A slot
 * with no content takes no space. In forced colors the border is always drawn in the system text
 * color, whatever `--su3-comp-card-border-color` says, because shadows and tints are not shown.
 *
 * @tagname su3-card
 * @summary A surface with media, header, body and actions areas in three variants.
 *
 * @slot media - Full-bleed content at the top, for example an image.
 * @slot header - Title and subtitle.
 * @slot - The body.
 * @slot actions - Buttons or links at the end of the card.
 *
 * @csspart card - The container.
 * @csspart media - Wrapper of the media slot.
 * @csspart header - Wrapper of the header slot.
 * @csspart body - Wrapper of the default slot.
 * @csspart actions - Wrapper of the actions slot.
 *
 * @cssprop [--su3-comp-card-container-color] - Background color.
 * @cssprop [--su3-comp-card-text-color] - Text color.
 * @cssprop [--su3-comp-card-container-shape] - Corner radius.
 * @cssprop [--su3-comp-card-border-color] - Border color.
 * @cssprop [--su3-comp-card-border-width] - Border width.
 * @cssprop [--su3-comp-card-elevation] - Box shadow.
 * @cssprop [--su3-comp-card-padding] - Padding of the header, body and actions.
 * @cssprop [--su3-comp-card-gap] - Space between the areas.
 */
export class Su3Card extends LitElement {
  static override styles = cardStyles;

  static override properties: PropertyDeclarations = {
    variant: { reflect: true },
    hasMedia: { state: true },
    hasHeader: { state: true },
    hasBody: { state: true },
    hasActions: { state: true },
  };

  /** Visual style of the container. */
  declare variant: CardVariant;

  /** Whether each slot has content; empty areas are hidden (internal state). */
  declare hasMedia: boolean;
  declare hasHeader: boolean;
  declare hasBody: boolean;
  declare hasActions: boolean;

  constructor() {
    super();
    this.variant = 'elevated';
    this.hasMedia = false;
    this.hasHeader = false;
    this.hasBody = false;
    this.hasActions = false;
  }

  #hasContent(event: Event): boolean {
    const slot = event.currentTarget as HTMLSlotElement;
    return slot
      .assignedNodes({ flatten: true })
      .some(
        (node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent ?? '').trim() !== '',
      );
  }

  protected override render(): TemplateResult {
    return html`
      <div
        class="card ${this.hasMedia ? '' : 'no-media'} ${this.hasHeader || this.hasBody || this.hasActions ? '' : 'media-only'}"
        part="card"
      >
        <div class="media" part="media" ?hidden=${!this.hasMedia}>
          <slot
            name="media"
            @slotchange=${(e: Event) => (this.hasMedia = this.#hasContent(e))}
          ></slot>
        </div>
        <div class="header" part="header" ?hidden=${!this.hasHeader}>
          <slot
            name="header"
            @slotchange=${(e: Event) => (this.hasHeader = this.#hasContent(e))}
          ></slot>
        </div>
        <div class="body" part="body" ?hidden=${!this.hasBody}>
          <slot @slotchange=${(e: Event) => (this.hasBody = this.#hasContent(e))}></slot>
        </div>
        <div class="actions" part="actions" ?hidden=${!this.hasActions}>
          <slot
            name="actions"
            @slotchange=${(e: Event) => (this.hasActions = this.#hasContent(e))}
          ></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-card': Su3Card;
  }
}
