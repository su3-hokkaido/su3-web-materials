/**
 * Reference tokens (`--su3-ref-*`): raw values with no meaning attached. Generated from the seed
 * color described in docs/design/design-language.md. Components never use these directly; they go
 * through the system tokens in `sys.ts`.
 */

/** Color ramps (`--su3-ref-palette-{ramp}-{step}`), stored as sRGB hex. */
export const palette = {
  accent: {
    50: '#e4faff',
    100: '#c8f4ff',
    200: '#88e8ff',
    300: '#54d0ec',
    400: '#2eb3ce',
    500: '#0096af',
    600: '#00798e',
    700: '#006071',
    800: '#004856',
    900: '#00343f',
    950: '#001f27',
  },
  neutral: {
    50: '#f5fbff',
    100: '#ecf5fb',
    200: '#e1e9ef',
    300: '#cdd6db',
    400: '#a4acb1',
    500: '#80878c',
    600: '#5d6469',
    700: '#42494d',
    800: '#282f33',
    900: '#151c1f',
    950: '#070c10',
  },
  danger: {
    50: '#fff2f0',
    100: '#ffe4e1',
    200: '#ffc8c2',
    300: '#ffa098',
    400: '#fa706a',
    500: '#dd5652',
    600: '#c13c3b',
    700: '#a51e24',
    800: '#860010',
    900: '#660009',
    950: '#440003',
  },
} as const;

/** `--su3-ref-palette-white`. */
export const white = '#ffffff';

/** Font stacks (`--su3-ref-typeface-{name}`). System fonts only: nothing is bundled. */
export const typeface = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif',
  mono: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
} as const;

export type Ramp = keyof typeof palette;
export type Step = keyof (typeof palette)['accent'];
/** A palette entry such as `accent-700`. */
export type PaletteKey = `${Ramp}-${Step}`;
