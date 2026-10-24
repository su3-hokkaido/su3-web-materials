import { html, LitElement, type PropertyDeclarations, type TemplateResult } from 'lit';
import { optionStyles } from './option.styles.ts';

/**
 * One choice of a `su3-select`. The item is itself the focus target: the element sets `role="option"`,
 * `aria-selected` and `aria-disabled` as attributes on the host, and the select moves focus between
 * options and marks the chosen one. Selection is handled by the select; use an option inside a select.
 *
 * Put the text in the default slot and, optionally, an icon in the `leading` slot. The text is what
 * the select shows once the option is chosen and what typing searches for.
 *
 * @tagname su3-option
 * @summary One choice of a select.
 *
 * @slot - The text.
 * @slot leading - An icon before the text.
 *
 * @csspart option - The row.
 *
 * @cssprop [--su3-comp-select-option-color] - Text color.
 * @cssprop [--su3-comp-select-option-selected-color] - Background of the chosen option.
 * @cssprop [--su3-comp-select-focus-ring-color] - Focus indicator color.
 * @cssprop [--su3-comp-select-focus-ring-width] - Focus indicator thickness.
 */
export class Su3Option extends LitElement {
  static override styles = optionStyles;

  static override properties: PropertyDeclarations = {
    value: {},
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  /** The value the select takes while this option is chosen. Defaults to the empty string. */
  declare value: string;

  /** Whether this option is chosen. As an attribute it is the select's initial choice. */
  declare selected: boolean;

  /** Makes the option unavailable: it is skipped by the keyboard and cannot be chosen. */
  declare disabled: boolean;

  constructor() {
    super();
    this.value = '';
    this.selected = false;
    this.disabled = false;
  }

  /** The option's own text, without its `leading` content. Read when needed, not observed. */
  get label(): string {
    return [...this.childNodes]
      .filter((node) => !(node instanceof Element) || !node.hasAttribute('slot'))
      .map((node) => node.textContent)
      .join('')
      .trim();
  }

  protected override willUpdate(): void {
    // Roving focus: an option is focusable by script only, the select moves focus between options.
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
    this.setAttribute('role', 'option');
    this.setAttribute('aria-selected', String(this.selected));
    if (this.disabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
  }

  protected override render(): TemplateResult {
    return html`<div class="option" part="option">
      <slot name="leading"></slot>
      <span class="label"><slot></slot></span>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-option': Su3Option;
  }
}
