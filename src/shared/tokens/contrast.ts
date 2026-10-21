import { sysTokenEntries } from './css.ts';

/** Relative luminance of an `#rrggbb` color (WCAG 2.x). */
export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/** WCAG contrast ratio between two `#rrggbb` colors. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

export type ColorMode = 'light' | 'dark';

/** [foreground role, background role, minimum ratio]: 4.5 for text, 3 for non-text indicators. */
export const contrastPairs: readonly (readonly [string, string, number])[] = [
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

/**
 * The opaque `#rrggbb` color of every color role in one mode: the built-in defaults, with
 * `overrides` (role name -> hex, e.g. from a product theme) applied on top.
 */
export function resolveColorRoles(
  mode: ColorMode,
  overrides: Readonly<Record<string, string>> = {},
): Record<string, string> {
  const roles: Record<string, string> = {};
  for (const entry of sysTokenEntries) {
    if (!entry.name.startsWith('color-')) continue;
    const value = (mode === 'dark' ? entry.dark : entry.light)?.literal;
    // Translucent roles (overlay) carry an alpha channel and take no part in contrast pairs.
    if (value?.length === 7) roles[entry.name.slice('color-'.length)] = value;
  }
  return { ...roles, ...overrides };
}

export interface ContrastFailure {
  pair: string;
  ratio: number;
  minimum: number;
}

/** Every pair of {@link contrastPairs} that falls below its minimum in the given role colors. */
export function findContrastFailures(roles: Readonly<Record<string, string>>): ContrastFailure[] {
  return contrastPairs.flatMap(([foreground, background, minimum]) => {
    const fg = roles[foreground];
    const bg = roles[background];
    if (fg === undefined || bg === undefined) {
      return [{ pair: `${foreground} on ${background} (missing role)`, ratio: 0, minimum }];
    }
    const ratio = contrastRatio(fg, bg);
    return ratio >= minimum
      ? []
      : [{ pair: `${foreground} (${fg}) on ${background} (${bg})`, ratio, minimum }];
  });
}
