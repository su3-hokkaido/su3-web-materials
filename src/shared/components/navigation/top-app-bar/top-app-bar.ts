import {
  html,
  LitElement,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { topAppBarStyles } from './top-app-bar.styles.ts';

/** Layout of the bar: one row with the title at the start, one row centered, or two rows. */
export type TopAppBarVariant = 'small' | 'center' | 'large';

/**
 * The bar at the top of a page: a leading control, the page title and trailing actions. It renders
 * a `<header>`, which is the page's banner landmark when the bar is not inside another sectioning
 * element.
 *
 * Put a menu or back button in the `navigation` slot, the title in the default slot and icon
 * buttons in the `actions` slot. The title is not wrapped in a heading: slot an `h1` (or plain
 * text) and the bar styles it. `variant` chooses `small` (title at the start), `center` or `large`
 * (a second row with a larger title); the large title does not collapse on scroll.
 *
 * `sticky` keeps the bar at the top of the viewport. With `elevate-on-scroll` the bar is raised
 * (`scrolled`) while the window is scrolled; it only observes the window, so an app with its own
 * scroll container sets `scrolled` itself.
 *
 * @tagname su3-top-app-bar
 * @summary The bar at the top of a page with a title and actions.
 *
 * @slot - The title: plain text or a heading element.
 * @slot navigation - The leading control, such as a menu icon button.
 * @slot actions - Trailing controls, such as icon buttons.
 *
 * @csspart bar - The `<header>` element.
 * @csspart leading - The wrapper around the navigation slot.
 * @csspart title - The wrapper around the title slot.
 * @csspart trailing - The wrapper around the actions slot.
 *
 * @cssprop [--su3-comp-top-app-bar-container-color] - Background of the bar.
 * @cssprop [--su3-comp-top-app-bar-scrolled-container-color] - Background while `scrolled`.
 * @cssprop [--su3-comp-top-app-bar-title-color] - Title color.
 * @cssprop [--su3-comp-top-app-bar-elevation] - Box shadow while `scrolled`.
 * @cssprop [--su3-comp-top-app-bar-height] - Minimum height of the bar (the first row in the large
 * variant).
 */
export class Su3TopAppBar extends LitElement {
  static override styles = topAppBarStyles;

  static override properties: PropertyDeclarations = {
    variant: { reflect: true },
    sticky: { type: Boolean, reflect: true },
    elevateOnScroll: { type: Boolean, attribute: 'elevate-on-scroll' },
    scrolled: { type: Boolean, reflect: true },
  };

  /** The layout: `small`, `center` or `large`. */
  declare variant: TopAppBarVariant;

  /** Keeps the bar at the top of the viewport while the page scrolls. */
  declare sticky: boolean;

  /** Raises the bar while the window is scrolled. */
  declare elevateOnScroll: boolean;

  /** Whether the bar is raised. Set from the window scroll position with `elevate-on-scroll`. */
  declare scrolled: boolean;

  #listening = false;

  constructor() {
    super();
    this.variant = 'small';
    this.sticky = false;
    this.elevateOnScroll = false;
    this.scrolled = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#sync();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#stopListening();
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has('elevateOnScroll')) {
      this.#sync();
      // Turning the option off drops the raised state it set; a reconnect keeps a manual one.
      if (!this.elevateOnScroll && changed.get('elevateOnScroll') === true) this.scrolled = false;
    }
  }

  #sync(): void {
    if (this.elevateOnScroll && this.isConnected) {
      if (!this.#listening) {
        this.#listening = true;
        window.addEventListener('scroll', this.#onScroll, { passive: true });
      }
      this.#onScroll();
    } else {
      this.#stopListening();
    }
  }

  #stopListening(): void {
    if (!this.#listening) return;
    this.#listening = false;
    window.removeEventListener('scroll', this.#onScroll);
  }

  #onScroll = (): void => {
    this.scrolled = window.scrollY > 0;
  };

  protected override render(): TemplateResult {
    return html`<header class="bar" part="bar">
      <div class="leading" part="leading"><slot name="navigation"></slot></div>
      <div class="title" part="title"><slot></slot></div>
      <div class="trailing" part="trailing"><slot name="actions"></slot></div>
    </header>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-top-app-bar': Su3TopAppBar;
  }
}
