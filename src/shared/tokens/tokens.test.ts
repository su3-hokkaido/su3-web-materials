import { describe, expect, it } from 'vitest';
import { buildTokensCss, compVar, sysTokenEntries, sysVar, type TokenValue } from './css.ts';

/** Relative luminance of an `#rrggbb` color (WCAG 2.x). */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

function colorValue(name: string, mode: 'light' | 'dark'): string {
  const entry = sysTokenEntries.find((candidate) => candidate.name === `color-${name}`);
  const value: TokenValue | undefined = mode === 'dark' ? entry?.dark : entry?.light;
  if (!value) throw new Error(`Missing ${mode} value for color-${name}`);
  return value.literal;
}

/** [foreground, background, minimum ratio]: 4.5 for text, 3 for non-text indicators. */
const pairs: readonly (readonly [string, string, number])[] = [
  ['text', 'surface', 4.5],
  ['text', 'surface-raised', 4.5],
  ['text-muted', 'surface', 4.5],
  ['text-muted', 'surface-raised', 4.5],
  ['text-muted', 'surface-sunken', 4.5],
  ['on-accent', 'accent', 4.5],
  ['on-accent', 'accent-hover', 4.5],
  ['on-accent', 'accent-active', 4.5],
  ['accent', 'surface', 4.5],
  ['accent', 'surface-raised', 4.5],
  ['accent', 'surface-sunken', 4.5],
  ['accent', 'accent-subtle', 4.5],
  ['on-accent-subtle', 'accent-subtle', 4.5],
  ['on-danger', 'danger', 4.5],
  ['danger', 'surface', 4.5],
  ['border-strong', 'surface', 3],
  ['border-strong', 'surface-sunken', 3],
  ['focus-ring', 'surface', 3],
];

describe('system color roles', () => {
  for (const mode of ['light', 'dark'] as const) {
    for (const [foreground, background, minimum] of pairs) {
      it(`${mode}: ${foreground} on ${background} is at least ${String(minimum)}:1`, () => {
        const ratio = contrast(colorValue(foreground, mode), colorValue(background, mode));
        expect(ratio).toBeGreaterThanOrEqual(minimum);
      });
    }
  }

  it('gives every color role a light and a dark value', () => {
    const colors = sysTokenEntries.filter((entry) => entry.name.startsWith('color-'));
    expect(colors.length).toBeGreaterThan(0);
    for (const entry of colors) expect(entry.dark, entry.name).toBeDefined();
  });
});

describe('tokens.css', () => {
  const css = buildTokensCss();

  it('declares every system token in the light block', () => {
    for (const { name } of sysTokenEntries) {
      expect(css, name).toContain(`--su3-sys-${name}:`);
    }
  });

  it('declares light values on the root and dark values for the attribute and the OS preference', () => {
    expect(css).toContain(":root,\n[data-theme='light'] {");
    expect(css).toContain("[data-theme='dark'] {");
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain(':root:not([data-theme])');
  });

  it('zeroes durations under reduced motion', () => {
    expect(css).toMatch(
      /prefers-reduced-motion: reduce\) \{\n {2}:root \{\n {4}--su3-sys-motion-duration-fast: 0ms;/,
    );
  });

  it('references palette tokens instead of repeating hex values for roles', () => {
    expect(css).toContain('--su3-sys-color-accent: var(--su3-ref-palette-accent-700);');
  });
});

describe('sysVar and compVar', () => {
  it('falls back to the built-in light value', () => {
    expect(sysVar('color-accent').cssText).toBe('var(--su3-sys-color-accent, #006071)');
  });

  it('chains a component hook to a system token', () => {
    expect(compVar('button-container-color', sysVar('color-accent')).cssText).toBe(
      'var(--su3-comp-button-container-color, var(--su3-sys-color-accent, #006071))',
    );
  });

  it('rejects an unknown token at runtime', () => {
    expect(() => sysVar('color-nope' as never)).toThrow('Unknown system token');
  });
});
