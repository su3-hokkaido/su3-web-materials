import { css, unsafeCSS, type CSSResult } from 'lit';
import { sysVar } from '../tokens/index.ts';

/**
 * Declarations for a state layer: the control's content color painted over its container through a
 * pseudo-element (`::before`) of the element it is used on, which must be positioned. Every
 * interactive state is shown as an opacity of this layer, never as a color swap, so a container color
 * overridden by a theme or a hook still reacts (docs/design/design-language.md, "State layers").
 *
 * @param inset How far the layer extends beyond the padding box; a negative border width makes it
 *   cover a border too. Defaults to the padding box.
 */
export function stateLayerBox(inset: CSSResult | string = '0'): CSSResult {
  return css`
    content: '';
    position: absolute;
    inset: ${unsafeCSS(String(inset))};
    border-radius: inherit;
    background-color: currentcolor;
    opacity: 0;
    pointer-events: none;
    transition: opacity ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')};
  `;
}

/**
 * Opacity declarations for the layer's states. `--_overlay` (default 1) scales them, so a variant
 * that must not show the layer sets it to 0. Use them on the state's selector, for example
 * `.control:hover:not(:disabled)::before { ${stateLayerOpacity.hover} }`.
 */
export const stateLayerOpacity = {
  hover: css`
    opacity: calc(var(--_overlay, 1) * ${sysVar('state-hover-opacity')});
  `,
  focus: css`
    opacity: calc(var(--_overlay, 1) * ${sysVar('state-focus-opacity')});
  `,
  pressed: css`
    opacity: calc(var(--_overlay, 1) * ${sysVar('state-pressed-opacity')});
  `,
};
