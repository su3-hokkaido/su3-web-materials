/** Which side of the anchor the popup prefers; it flips to the other side when it does not fit. */
export type PopupSide = 'bottom' | 'top';

/** Which edge of the anchor the popup lines up with; `start` follows the text direction. */
export type PopupAlign = 'start' | 'end';

export interface PopupPlacement {
  /** The preferred side. */
  side: PopupSide;
  /** The anchor edge the popup lines up with. */
  align: PopupAlign;
  /** Gives the popup at least the anchor's width (for a select or a picker). */
  matchWidth?: boolean;
}

/**
 * Places a fixed-position popup below or above an anchor, aligned to the anchor's start or end edge,
 * on the opposite side when the preferred one has no room, and inside the viewport.
 *
 * The popup must be `position: fixed` with `inset: auto` and already shown (so it can be measured).
 * Its margin carries the gap to the anchor: it is read back to flip and clamp, and subtracted from
 * the coordinates that are set, because a margin shifts a fixed box. The coordinates, and the width
 * with `matchWidth`, depend on measurements, so they are set as inline styles.
 */
export function placePopup(
  surface: HTMLElement,
  anchorElement: Element,
  options: PopupPlacement,
): void {
  const anchor = anchorElement.getBoundingClientRect();
  if (options.matchWidth) surface.style.minInlineSize = `${String(anchor.width)}px`;
  const tip = surface.getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(surface).marginTop) || 0;
  const { clientWidth: width, clientHeight: height } = document.documentElement;
  const rtl = getComputedStyle(anchorElement).direction === 'rtl';

  const alignLeft = (options.align === 'end') === rtl;
  const x = alignLeft ? anchor.left : anchor.right - tip.width;

  const below = anchor.bottom + gap;
  const above = anchor.top - tip.height - gap;
  const fits = (y: number): boolean => y >= 0 && y + tip.height <= height;
  const preferred = options.side === 'top' ? above : below;
  const opposite = options.side === 'top' ? below : above;
  const y = fits(preferred) || !fits(opposite) ? preferred : opposite;

  const clampedX = Math.min(Math.max(x, gap), Math.max(gap, width - tip.width - gap));
  const clampedY = Math.min(Math.max(y, gap), Math.max(gap, height - tip.height - gap));
  surface.style.left = `${String(clampedX - gap)}px`;
  surface.style.top = `${String(clampedY - gap)}px`;
}
