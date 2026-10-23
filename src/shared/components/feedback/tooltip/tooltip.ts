import {
  html,
  LitElement,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { tooltipStyles } from './tooltip.styles.ts';

/** Where the tooltip appears relative to its trigger. `start` and `end` follow the text direction. */
export type TooltipPlacement = 'top' | 'bottom' | 'start' | 'end';

type Side = 'top' | 'bottom' | 'left' | 'right';

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

/** Time the pointer has to move from the trigger onto the tooltip before it closes. */
const GRACE_MS = 100;

let nextId = 0;

/**
 * A short text that describes its trigger. The tooltip wraps one trigger (the default slot) and a
 * plain-text description (the `content` slot, an element such as a `span`). It appears when the
 * pointer rests on the trigger for `delay` milliseconds and at once when the trigger receives
 * keyboard focus. It disappears when the pointer or focus leaves, on Escape and on a press on the
 * trigger, and it stays while the pointer is over the tooltip itself. It is shown in the top layer
 * (Popover API) on the `placement` side and flips or shifts to stay inside the viewport.
 *
 * The tooltip links the trigger to the description with `aria-describedby`. An id cannot cross a
 * shadow boundary, so the link does not reach the inner control of a shadow-based trigger such as
 * `su3-button`: keep the tooltip supplementary and give the trigger its own accessible name.
 * `open` shows the tooltip from code; `disabled` suppresses it and closes it when set.
 *
 * @tagname su3-tooltip
 * @summary A short description that appears on hover and focus.
 *
 * @slot - The trigger: one element the tooltip describes.
 * @slot content - The description, an element with plain text.
 *
 * @csspart surface - The tooltip surface.
 *
 * @cssprop [--su3-comp-tooltip-container-color] - Background of the surface.
 * @cssprop [--su3-comp-tooltip-label-color] - Text color.
 * @cssprop [--su3-comp-tooltip-container-shape] - Corner radius.
 * @cssprop [--su3-comp-tooltip-max-width] - Maximum width of the surface.
 * @cssprop [--su3-comp-tooltip-offset] - Gap between the trigger and the surface.
 * @cssprop [--su3-comp-tooltip-elevation] - Box shadow.
 */
export class Su3Tooltip extends LitElement {
  static override styles = tooltipStyles;

  static override properties: PropertyDeclarations = {
    open: { type: Boolean, reflect: true },
    delay: { type: Number },
    placement: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  /** Shows the tooltip. Pointer and focus set it; set it from code to show or hide it. */
  declare open: boolean;

  /** Milliseconds the pointer must rest on the trigger before the tooltip appears. */
  declare delay: number;

  /** The preferred side; it flips to the opposite side when it does not fit. */
  declare placement: TooltipPlacement;

  /** Suppresses the tooltip. */
  declare disabled: boolean;

  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this.open = false;
    this.delay = 500;
    this.placement = 'top';
    this.disabled = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('pointerenter', this.#onPointerEnter);
    this.addEventListener('pointerleave', this.#onPointerLeave);
    this.addEventListener('pointerdown', this.#onPointerDown);
    this.addEventListener('focusin', this.#onFocusIn);
    this.addEventListener('focusout', this.#onFocusOut);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('pointerenter', this.#onPointerEnter);
    this.removeEventListener('pointerleave', this.#onPointerLeave);
    this.removeEventListener('pointerdown', this.#onPointerDown);
    this.removeEventListener('focusin', this.#onFocusIn);
    this.removeEventListener('focusout', this.#onFocusOut);
    this.#stopTimer();
    this.#unlink();
    this.#unwatch();
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has('disabled') && this.disabled) {
      this.#stopTimer();
      this.open = false;
    }
  }

  protected override updated(): void {
    const surface = this.#surface();
    if (!surface) return;
    const wanted = this.open && !this.disabled;
    const shown = typeof surface.showPopover === 'function' && surface.matches(':popover-open');
    if (typeof surface.showPopover === 'function') {
      if (wanted && !shown) surface.showPopover();
      else if (!wanted && shown) surface.hidePopover();
    }
    if (wanted) {
      this.#place(surface);
      this.#watch();
    } else {
      this.#unwatch();
    }
  }

  #surface(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>('.surface');
  }

  #trigger(): Element | null {
    return this.querySelector(':scope > :not([slot="content"])');
  }

  #stopTimer(): void {
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  #showAfter(ms: number): void {
    this.#stopTimer();
    if (this.disabled) return;
    if (ms <= 0) {
      this.open = true;
      return;
    }
    this.#timer = setTimeout(() => {
      this.open = true;
    }, ms);
  }

  #hideAfter(ms: number): void {
    this.#stopTimer();
    if (!this.open) return;
    if (ms <= 0) {
      this.open = false;
      return;
    }
    this.#timer = setTimeout(() => {
      this.open = false;
    }, ms);
  }

  // The pointer events are on the host, which contains the top-layer surface in the flat tree: the
  // pointer moving from the trigger onto the surface does not leave the host, so there is no gap.
  #onPointerEnter = (event: PointerEvent): void => {
    // Touch has no hover; a tap is a press on the trigger, not a request for a description.
    if (event.pointerType === 'touch') return;
    this.#showAfter(this.delay);
  };

  #onPointerLeave = (): void => {
    this.#hideAfter(GRACE_MS);
  };

  #onPointerDown = (event: PointerEvent): void => {
    // A press on the tooltip itself (to select its text) keeps it open.
    if (event.composedPath().includes(this.#surface() ?? this)) return;
    this.#hideAfter(0);
  };

  #onFocusIn = (event: FocusEvent): void => {
    // Focus by a press is handled by the press; only keyboard-style focus shows the tooltip.
    // The innermost target is the real focused element, also inside a shadow-based trigger.
    const target = event.composedPath()[0];
    if (target instanceof Element && !target.matches(':focus-visible')) return;
    this.#showAfter(0);
  };

  #onFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget;
    if (next instanceof Node && this.contains(next)) return;
    this.#hideAfter(0);
  };

  // Escape dismisses a tooltip opened by hover too, so it is listened for on the document while open.
  #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.open) this.#hideAfter(0);
  };

  #linked: { trigger: Element; id: string } | undefined;

  /** Removes the id this tooltip added to a trigger that is no longer, or no longer described. */
  #unlink(): void {
    const linked = this.#linked;
    this.#linked = undefined;
    if (!linked) return;
    const ids = (linked.trigger.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((id) => id && id !== linked.id);
    if (ids.length > 0) linked.trigger.setAttribute('aria-describedby', ids.join(' '));
    else linked.trigger.removeAttribute('aria-describedby');
  }

  #onSlotChange = (): void => {
    const trigger = this.#trigger();
    const content = this.querySelector(':scope > [slot="content"]');
    this.#unlink();
    if (!trigger || !content) return;
    if (!content.id) {
      nextId += 1;
      content.id = `su3-tooltip-content-${String(nextId)}`;
    }
    const ids = (trigger.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    if (!ids.includes(content.id)) {
      trigger.setAttribute('aria-describedby', [...ids, content.id].join(' '));
      this.#linked = { trigger, id: content.id };
    }
  };

  #frame = 0;

  /** One placement per frame, however many scroll events arrive. */
  #onViewportChange = (): void => {
    if (this.#frame) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      const surface = this.#surface();
      if (surface && this.open) this.#place(surface);
    });
  };

  #watching = false;

  // The trigger can still be rendering or laying out when the tooltip opens (a shadow-based control
  // upgrades late), so the placement follows size changes of the host and of the surface.
  #observer: ResizeObserver | undefined;

  #watch(): void {
    if (this.#watching) return;
    this.#watching = true;
    this.#observer ??= new ResizeObserver(this.#onViewportChange);
    this.#observer.observe(this);
    const surface = this.#surface();
    if (surface) this.#observer.observe(surface);
    document.addEventListener('keydown', this.#onKeyDown);
    window.addEventListener('resize', this.#onViewportChange);
    window.addEventListener('scroll', this.#onViewportChange, true);
  }

  #unwatch(): void {
    if (!this.#watching) return;
    this.#watching = false;
    document.removeEventListener('keydown', this.#onKeyDown);
    window.removeEventListener('resize', this.#onViewportChange);
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    window.removeEventListener('scroll', this.#onViewportChange, true);
    this.#observer?.disconnect();
  }

  /** The preferred physical side, with `start` and `end` resolved through the text direction. */
  #preferredSide(): Side {
    switch (this.placement) {
      case 'bottom':
        return 'bottom';
      case 'start':
        return getComputedStyle(this).direction === 'rtl' ? 'right' : 'left';
      case 'end':
        return getComputedStyle(this).direction === 'rtl' ? 'left' : 'right';
      default:
        return 'top';
    }
  }

  /** Puts the surface beside the trigger, on the opposite side if needed, inside the viewport. */
  #place(surface: HTMLElement): void {
    const anchor = (this.#trigger() ?? this).getBoundingClientRect();
    const tip = surface.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(surface).marginTop) || 0;
    const { clientWidth: width, clientHeight: height } = document.documentElement;

    const spot = (side: Side): { x: number; y: number } => {
      switch (side) {
        case 'top':
          return {
            x: anchor.left + (anchor.width - tip.width) / 2,
            y: anchor.top - tip.height - gap,
          };
        case 'bottom':
          return { x: anchor.left + (anchor.width - tip.width) / 2, y: anchor.bottom + gap };
        case 'left':
          return {
            x: anchor.left - tip.width - gap,
            y: anchor.top + (anchor.height - tip.height) / 2,
          };
        default:
          return { x: anchor.right + gap, y: anchor.top + (anchor.height - tip.height) / 2 };
      }
    };
    const fits = (side: Side): boolean => {
      const { x, y } = spot(side);
      return side === 'top' || side === 'bottom'
        ? y >= 0 && y + tip.height <= height
        : x >= 0 && x + tip.width <= width;
    };

    const preferred = this.#preferredSide();
    const side = fits(preferred) || !fits(OPPOSITE[preferred]) ? preferred : OPPOSITE[preferred];
    const spotted = spot(side);
    const x = Math.min(Math.max(spotted.x, gap), Math.max(gap, width - tip.width - gap));
    const y = Math.min(Math.max(spotted.y, gap), Math.max(gap, height - tip.height - gap));

    // The margin shifts a fixed box by the gap, so the coordinates are reduced by it.
    surface.style.left = `${String(x - gap)}px`;
    surface.style.top = `${String(y - gap)}px`;
    surface.dataset.side = side;
  }

  protected override render(): TemplateResult {
    return html`<slot @slotchange=${this.#onSlotChange}></slot>
      <div class="surface" part="surface" role="tooltip" popover="manual">
        <slot name="content" @slotchange=${this.#onSlotChange}></slot>
      </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-tooltip': Su3Tooltip;
  }
}
