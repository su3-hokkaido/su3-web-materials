import { html, nothing, type PropertyDeclarations, type TemplateResult } from 'lit';
import { FormSubmitterElement } from '../../../behaviors/index.ts';
import { buttonStyles } from './button.styles.ts';

/** Emphasis levels, from the most to the least prominent. */
export type ButtonVariant = 'filled' | 'tonal' | 'elevated' | 'outlined' | 'text';

/** Control sizes: 32, 40 and 48px tall. */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Choose the variant by emphasis: `filled` for the single primary action on a screen, `tonal` and
 * `elevated` for secondary actions that need weight, `outlined` for medium emphasis and `text` for
 * the lowest. Setting `href` renders an anchor instead of a button. A `soft-disabled` button looks
 * disabled but stays focusable and announces why through `aria-disabled`; use it when the reason
 * for being unavailable must remain discoverable.
 *
 * Inside a form the button submits by default (`type="submit"`), like `<button>`. Set `type` to
 * `button` for plain actions or `reset` to reset the form. See `FormSubmitterElement` for how this
 * differs from a native submit button (no `event.submitter`, no `formaction`, not the default
 * button for Enter).
 *
 * Accessible name: use the label slot, or `aria-label` on the host for an icon-only button. The
 * host's `aria-label` is forwarded to the inner control; `aria-labelledby`, `<label for>` and other
 * ARIA attributes on the host are not forwarded.
 *
 * @tagname su3-button
 * @summary A button that triggers an action, submits or resets a form, or navigates as a link.
 *
 * @slot - The label.
 * @slot leading - An icon shown before the label.
 * @slot trailing - An icon shown after the label.
 *
 * @csspart button - The interactive element (a `<button>` or, with `href`, an `<a>`).
 * @csspart label - The wrapper around the default slot.
 *
 * @cssprop [--su3-comp-button-container-color] - Background color.
 * @cssprop [--su3-comp-button-label-color] - Label and icon color.
 * @cssprop [--su3-comp-button-border-color] - Border color.
 * @cssprop [--su3-comp-button-border-width=1px] - Border width.
 * @cssprop [--su3-comp-button-container-shape] - Corner radius.
 * @cssprop [--su3-comp-button-elevation] - Box shadow.
 * @cssprop [--su3-comp-button-height] - Height.
 * @cssprop [--su3-comp-button-padding-inline] - Horizontal padding.
 * @cssprop [--su3-comp-button-gap] - Space between icon and label.
 * @cssprop [--su3-comp-button-icon-size] - Size of slotted icons.
 * @cssprop [--su3-comp-button-font-family] - Font family.
 * @cssprop [--su3-comp-button-font-size] - Font size.
 * @cssprop [--su3-comp-button-font-weight] - Font weight.
 * @cssprop [--su3-comp-button-line-height] - Line height.
 * @cssprop [--su3-comp-button-focus-ring-color] - Focus indicator color.
 * @cssprop [--su3-comp-button-focus-ring-width] - Focus indicator thickness.
 * @cssprop [--su3-comp-button-focus-ring-offset] - Gap between the control and its focus indicator.
 */
export class Su3Button extends FormSubmitterElement {
  static override styles = buttonStyles;

  static override properties: PropertyDeclarations = {
    variant: { reflect: true },
    size: { reflect: true },
    softDisabled: { type: Boolean, attribute: 'soft-disabled', reflect: true },
    href: {},
    target: {},
    download: {},
    rel: {},
    hasLabel: { state: true },
  };

  /** Emphasis level. */
  declare variant: ButtonVariant;

  /** Control size. */
  declare size: ButtonSize;

  /**
   * Disabled in appearance and behavior, but still focusable. Activating the control does nothing
   * and `aria-disabled` is exposed. Clicks dispatched on the host itself (`host.click()`) are not
   * intercepted, but they never submit the form or follow the link.
   */
  declare softDisabled: boolean;

  /** When set, the button renders as a link to this URL. */
  declare href: string;

  /** Where to open the link (`_blank`, ...). Only used with `href`. */
  declare target: string;

  /** Makes the link download the target; the value suggests a file name. Only used with `href`. */
  declare download: string;

  /** Link relationship. Only used with `href`. */
  declare rel: string;

  /** Whether the default slot has content; an icon-only button has none and is laid out square. */
  declare hasLabel: boolean;

  constructor() {
    super();
    this.variant = 'filled';
    this.size = 'md';
    this.softDisabled = false;
    this.href = '';
    this.target = '';
    this.download = '';
    this.rel = '';
    this.hasLabel = true;
  }

  protected override willUpdate(): void {
    this.hasLabel = hasLabelContent(this);
  }

  protected override get canPerformFormAction(): boolean {
    return super.canPerformFormAction && !this.softDisabled && !this.href;
  }

  protected override render(): TemplateResult {
    // The label wrapper is hidden without content, so an icon-only button has no empty flex item
    // (which would add a gap) and `icon-only` can lay it out square.
    const content = html`<slot name="leading"></slot>
      <span class="label" part="label" ?hidden=${!this.hasLabel}
        ><slot @slotchange=${this.#onLabelSlotChange}></slot
      ></span>
      <slot name="trailing"></slot>`;
    const controlClass = this.hasLabel ? 'control' : 'control icon-only';
    const unavailable = this.isDisabled || this.softDisabled;

    if (this.href) {
      // An anchor without href is neither a link for assistive technology nor focusable, so the
      // role is explicit and a soft-disabled link gets a tabindex to stay reachable. A hard-disabled
      // link is intentionally left out of the tab order.
      return html`<a
        class=${controlClass}
        part="button"
        href=${unavailable ? nothing : this.href}
        target=${this.target || nothing}
        download=${this.download || nothing}
        rel=${this.rel || nothing}
        role=${unavailable ? 'link' : nothing}
        tabindex=${this.softDisabled && !this.isDisabled ? '0' : nothing}
        aria-disabled=${unavailable ? 'true' : nothing}
        aria-label=${this.accessibleName ?? nothing}
        @click=${this.#onControlClick}
        >${content}</a
      >`;
    }

    return html`<button
      class=${controlClass}
      part="button"
      type="button"
      ?disabled=${this.isDisabled}
      aria-disabled=${this.softDisabled && !this.isDisabled ? 'true' : nothing}
      aria-label=${this.accessibleName ?? nothing}
      @click=${this.#onControlClick}
    >
      ${content}
    </button>`;
  }

  #onLabelSlotChange = (): void => {
    this.hasLabel = hasLabelContent(this);
  };

  /**
   * Swallows clicks on the inner control while unavailable, so neither host listeners nor the link
   * see them. Clicks dispatched on the host (`host.click()`) bypass this; the form action and the
   * link are guarded separately (`canPerformFormAction`, the missing `href`).
   */
  #onControlClick = (event: Event): void => {
    if (this.isDisabled || this.softDisabled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
}

/** Text or an element without a `slot` attribute: what the default slot shows. */
function hasLabelContent(host: HTMLElement): boolean {
  return [...host.childNodes].some((node) =>
    node instanceof Text
      ? node.data.trim() !== ''
      : node instanceof Element && (node.getAttribute('slot') ?? '') === '',
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-button': Su3Button;
  }
}
