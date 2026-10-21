import { css } from 'lit';
import { sysVar } from '../tokens/index.ts';

/**
 * Declarations for an invisible `::after` that extends a control's hit area to the minimum touch size
 * without changing its visible size. Apply them inside `@media (pointer: coarse)` to the control's
 * `::after`, on a positioned element: a control smaller than the minimum grows by the difference on
 * both sides, a larger one is left alone.
 */
export const touchTargetBox = css`
  content: '';
  position: absolute;
  inset-block: min(0px, calc((100% - ${sysVar('size-hit-area')}) / 2));
  inset-inline: 0;
`;
