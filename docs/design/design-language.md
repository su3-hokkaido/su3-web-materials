# Design language: Snowfield

Snowfield is the original visual language of this catalog. It defines the values behind the
`--su3-ref-*` and `--su3-sys-*` tokens (`docs/project_plan.md` section 10). It is not derived from
Material Design or any other published design system: role names, scales and shapes below were
chosen independently, and the palette was generated from the seed color in this document.

## Principles

1. **Calm and precise.** Cool, low-chroma neutrals carry the interface; one accent color marks what
   can be acted on.
2. **Flat first.** Hierarchy comes from surface tone and borders; shadows are reserved for things
   that float.
3. **Accessible by construction.** Every text role meets 4.5:1 and every non-text indicator meets
   3:1, in light and dark, verified numerically (see Contrast).
4. **Themable by tokens.** A product re-themes the catalog by overriding `--su3-sys-*` only.

## Seed and color generation

- Seed: an ice teal, `oklch(0.62 0.115 215)` (about `#0096af`).
- Ramps are defined in OKLCH with fixed lightness steps, then reduced in chroma where needed to stay
  inside sRGB and stored as hex so every tool reads them identically.
- Three ramps: **accent** (hue 215), **neutral** (hue 235, chroma 0.012, a slight cool tint),
  **danger** (hue 25). Steps: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950.

### Reference palette (`--su3-ref-palette-{ramp}-{step}`)

| Step | Accent    | Neutral   | Danger    |
| ---- | --------- | --------- | --------- |
| 50   | `#e4faff` | `#f5fbff` | `#fff2f0` |
| 100  | `#c8f4ff` | `#ecf5fb` | `#ffe4e1` |
| 200  | `#88e8ff` | `#e1e9ef` | `#ffc8c2` |
| 300  | `#54d0ec` | `#cdd6db` | `#ffa098` |
| 400  | `#2eb3ce` | `#a4acb1` | `#fa706a` |
| 500  | `#0096af` | `#80878c` | `#dd5652` |
| 600  | `#00798e` | `#5d6469` | `#c13c3b` |
| 700  | `#006071` | `#42494d` | `#a51e24` |
| 800  | `#004856` | `#282f33` | `#860010` |
| 900  | `#00343f` | `#151c1f` | `#660009` |
| 950  | `#001f27` | `#070c10` | `#440003` |

## System color roles (`--su3-sys-color-*`)

Roles describe purpose, not hue. Components use roles only, never ramp steps.

| Role               | Purpose                                         | Light              | Dark               |
| ------------------ | ----------------------------------------------- | ------------------ | ------------------ |
| `surface`          | Page background                                 | neutral-50         | neutral-900        |
| `surface-raised`   | Cards, menus, dialogs                           | white              | neutral-800        |
| `surface-sunken`   | Wells, inputs at rest, table stripes            | neutral-100        | neutral-950        |
| `text`             | Primary text                                    | neutral-900        | neutral-50         |
| `text-muted`       | Secondary text, placeholders                    | neutral-600        | neutral-300        |
| `border`           | Hairlines and dividers                          | neutral-200        | neutral-700        |
| `border-strong`    | Input and outline-button borders (non-text 3:1) | neutral-500        | neutral-500        |
| `accent`           | Filled controls, links, selected state          | accent-700         | accent-300         |
| `accent-hover`     | Accent on hover, for elements that swap color   | accent-800         | accent-200         |
| `accent-active`    | Accent while pressed                            | accent-900         | accent-100         |
| `on-accent`        | Content on `accent`                             | accent-50          | neutral-950        |
| `accent-subtle`    | Tonal fills                                     | accent-100         | accent-800         |
| `on-accent-subtle` | Content on `accent-subtle`                      | accent-800         | accent-100         |
| `danger`           | Destructive and error                           | danger-700         | danger-300         |
| `on-danger`        | Content on `danger`                             | danger-50          | danger-950         |
| `focus-ring`       | Focus indicator                                 | accent-500         | accent-400         |
| `overlay`          | Scrim behind modal surfaces                     | neutral-950 at 48% | neutral-950 at 64% |

`white` is `#ffffff` and is used only for `surface-raised`. Disabled content uses `text` at 38%
opacity; disabled containers use `text` at 12% opacity.

### Contrast (WCAG 2.x, computed from the hex values above)

| Pair                                    | Light | Dark | Required |
| --------------------------------------- | ----- | ---- | -------- |
| `text` on `surface`                     | 16.5  | 16.5 | 4.5      |
| `text-muted` on `surface`               | 5.8   | 11.7 | 4.5      |
| `text-muted` on `surface-sunken`        | 5.4   | 13.3 | 4.5      |
| `text-muted` on `surface-raised`        | 6.0   | 9.2  | 4.5      |
| `on-accent` on `accent`                 | 6.7   | 10.9 | 4.5      |
| `accent` (text/link) on `surface`       | 6.9   | 9.5  | 4.5      |
| `on-accent-subtle` on `accent-subtle`   | 8.7   | 8.7  | 4.5      |
| `on-danger` on `danger`                 | 6.8   | 8.6  | 4.5      |
| `danger` (text) on `surface`            | 7.2   | 8.8  | 4.5      |
| `border-strong` on `surface` (non-text) | 3.5   | 4.7  | 3.0      |
| `border-strong` on `surface-sunken`     | 3.3   | 5.4  | 3.0      |
| `focus-ring` on `surface` (non-text)    | 3.4   | 6.9  | 3.0      |

These numbers must be re-checked whenever a ramp value changes. `src/shared/tokens/tokens.test.ts`
asserts the same thresholds over the token values, in light and dark.

## Shape (`--su3-sys-shape-*`)

Corners are small and square-leaning, which is the main visual difference from pill-shaped systems.

| Token  | Value  | Used for                         |
| ------ | ------ | -------------------------------- |
| `none` | 0      | Dividers, full-bleed regions     |
| `xs`   | 2px    | Checkbox, small tags             |
| `sm`   | 4px    | Inputs, small buttons            |
| `md`   | 8px    | Buttons, menus, cards            |
| `lg`   | 12px   | Dialogs, large surfaces          |
| `pill` | 9999px | Switches, badges, optional chips |

Buttons use `md`; a product may switch them to `pill` by overriding
`--su3-comp-button-container-shape`.

## Spacing and size

- Base unit 4px: `--su3-sys-space-{1,2,3,4,5,6,8}` = 4, 8, 12, 16, 20, 24, 32px.
- Control heights: `sm` 32px, `md` 40px, `lg` 48px. Controls keep a 44px minimum hit area on coarse
  pointers (`@media (pointer: coarse)`), extended with padding or a pseudo-element rather than by
  changing the visible size.
- Icon size 20px inside `md` controls (16px in `sm`, 24px in `lg`).
- Segmented buttons use the control heights (32, 40 and 48px), `md` outer corners and one shared
  border line between segments; the selected segment is tinted and shows a check mark.
- Navigation bar items are equal-width columns with a 64x32px pill indicator behind a 24px icon and a
  `label-sm` label; the selected item is marked by the tinted pill and `aria-current`.
- The navigation rail is 80px wide (the pill plus 8px on each side), stacks the same items with a
  12px gap and draws one border line on its inline-end edge.
- The navigation drawer is 288px wide with 12px padding. Its items use the inline layout: a 48px high
  pill over the whole row, 16px side padding, 12px between icon and label. A modal drawer uses
  `elevation-3`, `lg` corners on its outer edge and the `overlay` color as the scrim; section
  headings use `label-sm` in the muted text color.
- Badges are 20px high pills (an 8px dot without text), with `label-sm` type.
- Snackbars use the inverse of the page (`text` as the container, `surface` as the label), `sm`
  corners and `elevation-3`, sit 16px above the bottom edge and are at most 576px wide.
- Tooltips use the inverse of the page like snackbars, `sm` corners, `elevation-2`, `label-sm` type,
  8px of space around the text and are at most 240px wide, 8px from their trigger. A tooltip is
  supplementary: its description reaches the trigger through `aria-describedby`, which does not cross
  into the inner control of a shadow-based trigger, so the trigger keeps its own accessible name.
- Cards use `md` corners, 16px padding and a 12px gap between areas; media is full-bleed.
- Checkbox box 20px (`--su3-sys-size-checkbox`); switch track 44x24px and thumb 16px
  (`--su3-sys-size-switch-track-width`, `-track-height`, `-thumb`). Icon buttons are square at the
  control heights (32, 40 and 48px).

## Typography (`--su3-sys-type-*`)

- Families: `--su3-ref-typeface-sans` is the system UI stack
  (`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif`) and
  `--su3-ref-typeface-mono` is `ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`. No
  web font is bundled in the MVP, which keeps the package small and avoids font licensing.
- Weights: 400 regular, 500 medium, 600 semibold.

| Role       | Size / line height | Weight | Used for             |
| ---------- | ------------------ | ------ | -------------------- |
| `caption`  | 12px / 16px        | 400    | Helper text          |
| `label-sm` | 13px / 16px        | 500    | Small control labels |
| `label`    | 14px / 20px        | 500    | Buttons, form labels |
| `body`     | 16px / 24px        | 400    | Body copy            |
| `title`    | 20px / 28px        | 600    | Section titles       |
| `heading`  | 28px / 36px        | 600    | Page headings        |

Sizes are expressed in `rem` at the token level (1rem = 16px) so user font settings scale the UI.

## Elevation (`--su3-sys-elevation-*`)

| Level | Use                     | Light                                                     |
| ----- | ----------------------- | --------------------------------------------------------- |
| `0`   | Flat                    | none                                                      |
| `1`   | Elevated buttons, cards | `0 1px 2px` and `0 1px 3px` of neutral-950 at 12% / 10%   |
| `2`   | Menus, popovers         | `0 4px 8px` and `0 2px 4px` of neutral-950 at 14% / 10%   |
| `3`   | Dialogs                 | `0 12px 24px` and `0 4px 8px` of neutral-950 at 16% / 12% |

In dark mode shadows are hard to see, so raised surfaces also get a 1px edge
(`--su3-sys-color-elevation-edge`, transparent in light mode) to separate them from the background. In `forced-colors` mode elevation is replaced by a system-color border.

## State layers

Interactive controls show state by overlaying the content color on the container, not by swapping
colors: hover 8%, focus-visible 10% (plus the focus ring), pressed 14%. Disabled controls do not
react. The values are `--su3-sys-state-{hover,focus,pressed}-opacity`.

## Focus

A 2px `focus-ring` outline with a 2px offset, drawn with `outline` so it follows `border-radius`
and remains visible in `forced-colors` mode (where it maps to `Highlight`). Focus is shown for
`:focus-visible` only.

## Motion (`--su3-sys-motion-*`)

| Token             | Value                             |
| ----------------- | --------------------------------- |
| `duration-fast`   | 100ms (state changes)             |
| `duration-medium` | 200ms (small transitions)         |
| `duration-slow`   | 300ms (surfaces entering/leaving) |
| `easing-standard` | `cubic-bezier(0.2, 0, 0, 1)`      |
| `easing-exit`     | `cubic-bezier(0.4, 0, 1, 1)`      |

Under `prefers-reduced-motion: reduce`, the duration tokens resolve to 0ms and components also set
`transition: none`, so state changes are instant.

## Theming and dark mode

- Light is the default. Dark applies for `[data-theme="dark"]` on any ancestor, and also when no
  `data-theme` is set and `prefers-color-scheme: dark` matches. `[data-theme="light"]` forces light.
- A product theme (`src/products/{productId}/theme.css`) overrides only `--su3-sys-*` (and, rarely,
  `--su3-comp-*`). The contrasting demo product changes the accent ramp and the shape scale to show
  the range.

## Provenance

The palette is generated from the stated seed with the OKLCH method above, the role names
(`surface`, `accent`, `text`, ...), shape scale, type scale and motion values were chosen for this
project, and no text or values were copied from another design system.
