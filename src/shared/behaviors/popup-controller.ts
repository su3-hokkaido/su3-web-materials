import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { placePopup, type PopupPlacement } from './popup-position.ts';

export interface PopupControllerOptions {
  /** The `popover="manual"` surface, once rendered. */
  surface: () => HTMLElement | null;
  /** The element the popup is placed against (the trigger or the field). */
  anchor: () => Element | null;
  /** Where to put the popup. */
  placement: () => PopupPlacement;
  /** Called when a press lands outside the host while the popup is open. */
  onOutsidePress: () => void;
}

/**
 * The mechanics every popup shares: showing and hiding the `popover="manual"` surface from an `open`
 * state, placing it against its anchor, keeping the placement right while the page scrolls, resizes
 * or the anchor changes size (a control can still be laying out when the popup opens), and noticing a
 * press outside the host. The host decides what `open` means and what closing does.
 *
 * Call {@link sync} from `updated()` with the current `open`; it returns true when the popup has just
 * been shown, which is the moment to move focus into it.
 */
export class PopupController implements ReactiveController {
  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #options: PopupControllerOptions;
  #watching = false;
  #observer: ResizeObserver | undefined;
  #frame = 0;

  constructor(host: ReactiveControllerHost & HTMLElement, options: PopupControllerOptions) {
    this.#host = host;
    this.#options = options;
    host.addController(this);
  }

  hostDisconnected(): void {
    this.#unwatch();
  }

  /** Shows, hides or re-places the surface to match `open`; true when it was just shown. */
  sync(open: boolean): boolean {
    const surface = this.#options.surface();
    if (!surface) return false;
    const shown = surface.matches(':popover-open');
    if (open && !shown) {
      surface.showPopover();
      this.place();
      this.#watch(surface);
      return true;
    }
    if (!open && shown) {
      surface.hidePopover();
      this.#unwatch();
    } else if (open) {
      this.place();
    }
    return false;
  }

  /** Places the surface against its anchor. */
  place(): void {
    const surface = this.#options.surface();
    const anchor = this.#options.anchor();
    if (surface && anchor) placePopup(surface, anchor, this.#options.placement());
  }

  #onPointerDown = (event: PointerEvent): void => {
    if (!event.composedPath().includes(this.#host)) this.#options.onOutsidePress();
  };

  /** One placement per frame, however many scroll or resize events arrive. */
  #onViewportChange = (): void => {
    if (this.#frame) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.place();
    });
  };

  #watch(surface: HTMLElement): void {
    if (this.#watching) return;
    this.#watching = true;
    document.addEventListener('pointerdown', this.#onPointerDown, true);
    window.addEventListener('resize', this.#onViewportChange);
    window.addEventListener('scroll', this.#onViewportChange, true);
    this.#observer ??= new ResizeObserver(this.#onViewportChange);
    this.#observer.observe(this.#host);
    this.#observer.observe(surface);
  }

  #unwatch(): void {
    if (!this.#watching) return;
    this.#watching = false;
    document.removeEventListener('pointerdown', this.#onPointerDown, true);
    window.removeEventListener('resize', this.#onViewportChange);
    window.removeEventListener('scroll', this.#onViewportChange, true);
    this.#observer?.disconnect();
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }
}
