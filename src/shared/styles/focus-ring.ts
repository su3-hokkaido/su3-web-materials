import { css, type CSSResult } from 'lit';
import { compVar, sysVar } from '../tokens/index.ts';

/**
 * The focus indicator: an outline (so it follows `border-radius` and survives forced colors) whose
 * width, color and offset are the component's `--su3-comp-{prefix}-focus-ring-*` hooks, defaulting
 * to the system tokens. Use it on the element's `:focus-visible` state.
 *
 * @param prefix Component hook prefix, for example `button` for `--su3-comp-button-focus-ring-color`.
 */
export function focusRing(prefix: string): CSSResult {
  return css`
    outline: ${compVar(`${prefix}-focus-ring-width`, sysVar('size-focus-ring-width'))} solid
      ${compVar(`${prefix}-focus-ring-color`, sysVar('color-focus-ring'))};
    outline-offset: ${compVar(`${prefix}-focus-ring-offset`, sysVar('size-focus-ring-offset'))};
  `;
}

/** In forced colors the palette is replaced, so the ring uses the system highlight color. */
export const focusRingForcedColors = css`
  outline-color: Highlight;
`;
