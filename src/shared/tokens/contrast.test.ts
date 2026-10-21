import { describe, expect, it } from 'vitest';
import { contrastRatio, findContrastFailures, luminance, resolveColorRoles } from './contrast.ts';

describe('contrastRatio', () => {
  it('is 21:1 for black on white and 1:1 for equal colors', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 5);
  });

  it('computes the relative luminance of the extremes', () => {
    expect(luminance('#000000')).toBe(0);
    expect(luminance('#ffffff')).toBeCloseTo(1, 5);
  });
});

describe('resolveColorRoles', () => {
  it('returns opaque roles for both modes and leaves translucent roles out', () => {
    for (const mode of ['light', 'dark'] as const) {
      const roles = resolveColorRoles(mode);
      expect(roles['accent']).toMatch(/^#[0-9a-f]{6}$/);
      expect(roles).not.toHaveProperty('overlay');
    }
    expect(resolveColorRoles('light')['surface']).not.toBe(resolveColorRoles('dark')['surface']);
  });

  it('applies overrides on top of the defaults', () => {
    expect(resolveColorRoles('light', { accent: '#123456' })['accent']).toBe('#123456');
  });
});

describe('findContrastFailures', () => {
  it('finds none in the default palette', () => {
    for (const mode of ['light', 'dark'] as const) {
      expect(findContrastFailures(resolveColorRoles(mode))).toEqual([]);
    }
  });

  it('reports a pair that falls below its minimum', () => {
    const roles = resolveColorRoles('light', { 'on-accent': '#006070', accent: '#006071' });
    const failures = findContrastFailures(roles);
    expect(failures.map((failure) => failure.pair).join('\n')).toContain('on-accent');
    expect(failures[0]?.ratio).toBeLessThan(failures[0]?.minimum ?? 0);
  });

  it('reports a missing role instead of skipping it', () => {
    const withoutText = resolveColorRoles('light');
    delete withoutText['text'];
    const failures = findContrastFailures(withoutText);
    expect(failures.some((failure) => failure.pair.includes('missing role'))).toBe(true);
  });
});
