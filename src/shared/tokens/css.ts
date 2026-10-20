import { unsafeCSS, type CSSResult } from 'lit';
import { palette, typeface, white } from './ref.ts';
import {
  reducedMotionTokens,
  sysColors,
  sysDisabled,
  sysElevation,
  sysMotion,
  sysShape,
  sysSize,
  sysSpace,
  sysState,
  sysType,
  type ColorSource,
  type SysColorRole,
} from './sys.ts';

/** A token value in the two forms the library needs. */
export interface TokenValue {
  /** What the stylesheet declares; references reference tokens where possible. */
  readonly ref: string;
  /** The concrete value, used as the built-in fallback inside components. */
  readonly literal: string;
}

export interface TokenEntry {
  /** Name without the `--su3-sys-` prefix, e.g. `color-accent`. */
  readonly name: string;
  readonly light: TokenValue;
  /** Present only for tokens whose value changes in dark mode. */
  readonly dark?: TokenValue;
}

type SysTokenName =
  | `color-${SysColorRole}`
  | `shape-${keyof typeof sysShape}`
  | `space-${keyof typeof sysSpace}`
  | `size-${keyof typeof sysSize}`
  | `typeface-${keyof typeof typeface}`
  | `type-${keyof typeof sysType}-${'size' | 'line-height' | 'weight'}`
  | `elevation-${keyof typeof sysElevation}`
  | `motion-${keyof typeof sysMotion}`
  | `state-${keyof typeof sysState}-opacity`
  | `disabled-${keyof typeof sysDisabled}-opacity`;

const PREFIX = '--su3';

function lookupHex(key: Exclude<ColorSource, { ref: unknown } | 'transparent'>): string {
  if (key === 'white') return white;
  const [ramp, step] = key.split('-') as [keyof typeof palette, string];
  const hex = (palette[ramp] as Record<string, string>)[step];
  if (hex === undefined) throw new Error(`Unknown palette key: ${key}`);
  return hex;
}

function paletteVar(key: string): string {
  return `var(${PREFIX}-ref-palette-${key})`;
}

function resolveColor(source: ColorSource): TokenValue {
  if (source === 'transparent') return { ref: 'transparent', literal: 'transparent' };
  if (typeof source === 'string') return { ref: paletteVar(source), literal: lookupHex(source) };
  const alphaHex = Math.round(source.alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return {
    ref: `color-mix(in srgb, ${paletteVar(source.ref)} ${String(Math.round(source.alpha * 100))}%, transparent)`,
    literal: `${lookupHex(source.ref)}${alphaHex}`,
  };
}

const plain = (value: string): TokenValue => ({ ref: value, literal: value });

function buildEntries(): TokenEntry[] {
  const entries: TokenEntry[] = [];
  for (const [role, source] of Object.entries(sysColors)) {
    entries.push({
      name: `color-${role}`,
      light: resolveColor(source.light),
      dark: resolveColor(source.dark),
    });
  }
  const add = (name: string, value: string): void => {
    entries.push({ name, light: plain(value) });
  };
  for (const [key, stack] of Object.entries(typeface)) {
    entries.push({
      name: `typeface-${key}`,
      light: { ref: `var(${PREFIX}-ref-typeface-${key})`, literal: stack },
    });
  }
  for (const [key, value] of Object.entries(sysShape)) add(`shape-${key}`, value);
  for (const [key, value] of Object.entries(sysSpace)) add(`space-${key}`, value);
  for (const [key, value] of Object.entries(sysSize)) add(`size-${key}`, value);
  for (const [role, props] of Object.entries(sysType)) {
    for (const [prop, value] of Object.entries(props)) add(`type-${role}-${prop}`, value);
  }
  for (const [key, value] of Object.entries(sysElevation)) add(`elevation-${key}`, value);
  for (const [key, value] of Object.entries(sysMotion)) add(`motion-${key}`, value);
  for (const [key, value] of Object.entries(sysState)) add(`state-${key}-opacity`, value);
  for (const [key, value] of Object.entries(sysDisabled)) add(`disabled-${key}-opacity`, value);
  return entries;
}

/** Every system token with its light and (where different) dark value. */
export const sysTokenEntries: readonly TokenEntry[] = buildEntries();

const entryByName = new Map(sysTokenEntries.map((entry) => [entry.name, entry]));

/**
 * A `var()` reference to a system token whose fallback is the token's built-in light value, so a
 * component still renders sensibly when `tokens.css` is not loaded.
 */
export function sysVar(name: SysTokenName): CSSResult {
  const entry = entryByName.get(name);
  if (!entry) throw new Error(`Unknown system token: ${name}`);
  return unsafeCSS(`var(${PREFIX}-sys-${name}, ${entry.light.literal})`);
}

/**
 * A component-level hook: `var(--su3-comp-{name}, {fallback})`. Pass a {@link sysVar} (or another
 * `compVar`) as the fallback, e.g. `compVar('button-container-color', sysVar('color-accent'))`.
 */
export function compVar(name: string, fallback: CSSResult | string): CSSResult {
  return unsafeCSS(`var(${PREFIX}-comp-${name}, ${String(fallback)})`);
}

const declare = (entries: readonly (readonly [string, string])[], indent = 2): string =>
  entries.map(([name, value]) => `${' '.repeat(indent)}${PREFIX}-${name}: ${value};`).join('\n');

function refDeclarations(): string {
  const lines: (readonly [string, string])[] = [['ref-palette-white', white]];
  for (const [ramp, steps] of Object.entries(palette)) {
    for (const [step, hex] of Object.entries(steps)) {
      lines.push([`ref-palette-${ramp}-${step}`, hex]);
    }
  }
  for (const [name, stack] of Object.entries(typeface)) lines.push([`ref-typeface-${name}`, stack]);
  return declare(lines);
}

const sysDeclarations = (mode: 'light' | 'dark', indent = 2): string =>
  declare(
    sysTokenEntries.flatMap((entry) => {
      const value = mode === 'dark' ? entry.dark : entry.light;
      return value ? [[`sys-${entry.name}`, value.ref] as const] : [];
    }),
    indent,
  );

/**
 * The default token stylesheet (also published as `tokens.css`). Light is the default; dark applies
 * for `[data-theme="dark"]` on any ancestor, or for the OS preference when no `data-theme` is set
 * on the root. `[data-theme="light"]` forces light for a subtree.
 */
export function buildTokensCss(): string {
  const reducedMotion = declare(
    reducedMotionTokens.map((name) => [`sys-motion-${name}`, '0ms'] as const),
    4,
  );
  const dark = sysDeclarations('dark');
  const nestedDark = sysDeclarations('dark', 4);
  return `:root {
${refDeclarations()}
}

:root,
[data-theme='light'] {
${sysDeclarations('light')}
}

[data-theme='dark'] {
${dark}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
${nestedDark}
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
${reducedMotion}
  }
}
`;
}

/** The default token stylesheet as a string, ready to inject or write to `tokens.css`. */
export const tokensCss: string = buildTokensCss();
