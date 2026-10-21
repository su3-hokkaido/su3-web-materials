import { describe, expect, it } from 'vitest';
import {
  focusRing,
  focusRingForcedColors,
  stateLayerBox,
  stateLayerOpacity,
  touchTargetBox,
} from './index.ts';

describe('stateLayerBox', () => {
  it('paints the current color over the box, hidden until a state shows it', () => {
    const { cssText } = stateLayerBox();
    expect(cssText).toContain("content: ''");
    expect(cssText).toContain('background-color: currentcolor');
    expect(cssText).toContain('opacity: 0');
    expect(cssText).toContain('pointer-events: none');
    expect(cssText).toContain('inset: 0');
    expect(cssText).toContain('var(--su3-sys-motion-duration-fast, 100ms)');
  });

  it('accepts an inset as a string or a CSS result', () => {
    expect(stateLayerBox('-1px').cssText).toContain('inset: -1px');
    expect(stateLayerBox(touchTargetBox).cssText).toContain('inset: ');
  });
});

describe('stateLayerOpacity', () => {
  it('scales each state token by the --_overlay variable, which defaults to 1', () => {
    expect(stateLayerOpacity.hover.cssText).toContain(
      'calc(var(--_overlay, 1) * var(--su3-sys-state-hover-opacity, 0.08))',
    );
    expect(stateLayerOpacity.focus.cssText).toContain('--su3-sys-state-focus-opacity');
    expect(stateLayerOpacity.pressed.cssText).toContain('--su3-sys-state-pressed-opacity');
  });
});

describe('focusRing', () => {
  it('uses the component hooks with the system tokens as fallback', () => {
    const { cssText } = focusRing('checkbox');
    expect(cssText).toContain('--su3-comp-checkbox-focus-ring-width');
    expect(cssText).toContain('--su3-comp-checkbox-focus-ring-color');
    expect(cssText).toContain('--su3-comp-checkbox-focus-ring-offset');
    expect(cssText).toContain('var(--su3-sys-color-focus-ring, #0096af)');
    expect(cssText).toContain('outline-offset');
  });

  it('switches to the system highlight color in forced colors', () => {
    expect(focusRingForcedColors.cssText).toContain('outline-color: Highlight');
  });
});

describe('touchTargetBox', () => {
  it('grows the box to the minimum hit area and never shrinks it', () => {
    expect(touchTargetBox.cssText).toContain(
      'min(0px, calc((100% - var(--su3-sys-size-hit-area, 2.75rem)) / 2))',
    );
    expect(touchTargetBox.cssText).toContain('position: absolute');
  });
});
