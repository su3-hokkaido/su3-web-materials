import { html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from 'lit';
import { dividerStyles } from './divider.styles.ts';

/** Direction of the line. */
export type DividerOrientation = 'horizontal' | 'vertical';

/**
 * A thin line that separates content. By default it is exposed to assistive technology as a
 * separator (`role="separator"` with its `aria-orientation`); set `decorative` when the line only
 * adds visual rhythm and should be ignored.
 *
 * A horizontal divider fills the width of its container; a vertical one stretches to the height of
 * a flex or grid row and needs such a container (or an explicit height) to be visible.
 *
 * @tagname su3-divider
 * @summary A horizontal or vertical separator line with an optional inset.
 *
 * @csspart divider - The line.
 *
 * @cssprop [--su3-comp-divider-color] - Line color.
 * @cssprop [--su3-comp-divider-thickness] - Line thickness.
 * @cssprop [--su3-comp-divider-inset] - Space left empty at the start (horizontal) or at both ends
 *   (vertical) when `inset` is set.
 */
export class Su3Divider extends LitElement {
  static override styles = dividerStyles;

  static override properties: PropertyDeclarations = {
    orientation: { reflect: true },
    inset: { type: Boolean, reflect: true },
    decorative: { type: Boolean, reflect: true },
  };

  /** Direction of the line. */
  declare orientation: DividerOrientation;

  /** Leaves space at the start of a horizontal line, or at both ends of a vertical one. */
  declare inset: boolean;

  /** The line is purely visual: it is not exposed as a separator. */
  declare decorative: boolean;

  constructor() {
    super();
    this.orientation = 'horizontal';
    this.inset = false;
    this.decorative = false;
  }

  protected override render(): TemplateResult {
    return html`<div
      class="line"
      part="divider"
      role=${this.decorative ? 'presentation' : 'separator'}
      aria-orientation=${this.decorative ? nothing : this.orientation}
    ></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-divider': Su3Divider;
  }
}
