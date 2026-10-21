import { describe, expect, it } from 'vitest';
import { contrastPairs, contrastRatio, resolveColorRoles } from './contrast.ts';
import { buildTokensCss, compVar, sysTokenEntries, sysVar } from './css.ts';

describe('system color roles', () => {
  for (const mode of ['light', 'dark'] as const) {
    const roles = resolveColorRoles(mode);
    for (const [foreground, background, minimum] of contrastPairs) {
      it(`${mode}: ${foreground} on ${background} is at least ${String(minimum)}:1`, () => {
        const fg = roles[foreground];
        const bg = roles[background];
        expect(fg, foreground).toBeDefined();
        expect(bg, background).toBeDefined();
        expect(contrastRatio(fg ?? '', bg ?? '')).toBeGreaterThanOrEqual(minimum);
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
