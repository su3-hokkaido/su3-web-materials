import { palette, type PaletteKey } from './ref.ts';

/**
 * System tokens (`--su3-sys-*`): roles and decisions. Components read these (through their own
 * `--su3-comp-*` hooks); products re-theme by overriding them. Values follow
 * docs/design/design-language.md.
 */

/** Where a color role takes its value from. */
export type ColorSource =
  'white' | 'transparent' | PaletteKey | { readonly ref: PaletteKey; readonly alpha: number };

interface ColorRole {
  readonly light: ColorSource;
  readonly dark: ColorSource;
}

/** Color roles (`--su3-sys-color-{role}`) with their light and dark sources. */
export const sysColors = {
  surface: { light: 'neutral-50', dark: 'neutral-900' },
  'surface-raised': { light: 'white', dark: 'neutral-800' },
  'surface-sunken': { light: 'neutral-100', dark: 'neutral-950' },
  text: { light: 'neutral-900', dark: 'neutral-50' },
  'text-muted': { light: 'neutral-600', dark: 'neutral-300' },
  border: { light: 'neutral-200', dark: 'neutral-700' },
  'border-strong': { light: 'neutral-500', dark: 'neutral-500' },
  accent: { light: 'accent-700', dark: 'accent-300' },
  'accent-hover': { light: 'accent-800', dark: 'accent-200' },
  'accent-active': { light: 'accent-900', dark: 'accent-100' },
  'on-accent': { light: 'accent-50', dark: 'neutral-950' },
  'accent-subtle': { light: 'accent-100', dark: 'accent-800' },
  'on-accent-subtle': { light: 'accent-800', dark: 'accent-100' },
  danger: { light: 'danger-700', dark: 'danger-300' },
  'on-danger': { light: 'danger-50', dark: 'danger-950' },
  'focus-ring': { light: 'accent-500', dark: 'accent-400' },
  overlay: {
    light: { ref: 'neutral-950', alpha: 0.48 },
    dark: { ref: 'neutral-950', alpha: 0.64 },
  },
  /** Edge drawn around raised surfaces; only visible in dark mode, where shadows are faint. */
  'elevation-edge': { light: 'transparent', dark: 'neutral-700' },
} as const satisfies Record<string, ColorRole>;

export type SysColorRole = keyof typeof sysColors;

/** Corner radii (`--su3-sys-shape-{name}`). */
export const sysShape = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  pill: '9999px',
} as const;

/** Spacing scale (`--su3-sys-space-{step}`), 4px base, in rem so it follows the user's font size. */
export const sysSpace = {
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
} as const;

/** Control and icon sizes (`--su3-sys-size-{name}`). */
export const sysSize = {
  'control-sm': '2rem',
  'control-md': '2.5rem',
  'control-lg': '3rem',
  'icon-sm': '1rem',
  'icon-md': '1.25rem',
  'icon-lg': '1.5rem',
  /** Minimum hit area on coarse pointers. */
  'hit-area': '2.75rem',
  /** The box of a checkbox. */
  checkbox: '1.25rem',
  /** The track and thumb of a switch. */
  'switch-track-width': '2.75rem',
  'switch-track-height': '1.5rem',
  'switch-thumb': '1rem',
  'border-width': '1px',
  'focus-ring-width': '2px',
  'focus-ring-offset': '2px',
} as const;

/** Type roles (`--su3-sys-type-{role}-{size|line-height|weight}`). */
export const sysType = {
  caption: { size: '0.75rem', 'line-height': '1rem', weight: '400' },
  'label-sm': { size: '0.8125rem', 'line-height': '1rem', weight: '500' },
  label: { size: '0.875rem', 'line-height': '1.25rem', weight: '500' },
  body: { size: '1rem', 'line-height': '1.5rem', weight: '400' },
  title: { size: '1.25rem', 'line-height': '1.75rem', weight: '600' },
  heading: { size: '1.75rem', 'line-height': '2.25rem', weight: '600' },
} as const;

/** Shadow color components, taken from neutral-950 so shadows share the palette's tint. */
function shadowColor(alpha: number): string {
  const hex = palette.neutral[950].slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${String(r)} ${String(g)} ${String(b)} / ${String(alpha)})`;
}

/** Elevation levels (`--su3-sys-elevation-{level}`). */
export const sysElevation = {
  0: 'none',
  1: `0 1px 2px ${shadowColor(0.12)}, 0 1px 3px ${shadowColor(0.1)}`,
  2: `0 4px 8px ${shadowColor(0.14)}, 0 2px 4px ${shadowColor(0.1)}`,
  3: `0 12px 24px ${shadowColor(0.16)}, 0 4px 8px ${shadowColor(0.12)}`,
} as const;

/** Motion (`--su3-sys-motion-{name}`). The durations become 0ms under reduced motion. */
export const sysMotion = {
  'duration-fast': '100ms',
  'duration-medium': '200ms',
  'duration-slow': '300ms',
  'easing-standard': 'cubic-bezier(0.2, 0, 0, 1)',
  'easing-exit': 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

/** Names of the motion tokens that are zeroed for `prefers-reduced-motion: reduce`. */
export const reducedMotionTokens = [
  'duration-fast',
  'duration-medium',
  'duration-slow',
] as const satisfies readonly (keyof typeof sysMotion)[];

/** State layer opacities (`--su3-sys-state-{name}-opacity`). */
export const sysState = {
  hover: '0.08',
  focus: '0.1',
  pressed: '0.14',
} as const;

/** `--su3-sys-disabled-*` opacities for content and container. */
export const sysDisabled = {
  content: '0.38',
  container: '0.12',
} as const;
