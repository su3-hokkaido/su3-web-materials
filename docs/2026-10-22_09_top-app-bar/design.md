# Top app bar

## Background

`docs/project_plan.md` section 14 item 9, second of the components that remain after the MVP (order:
tooltip, top app bar, dialog, menu, select, date picker, time picker, data table; the dialog and
menu are moved ahead of the select, which builds on them, a reordering of the list in section 14).
The tooltip is done; the top app bar belongs to the `navigation` category beside the bar, rail and drawer.

## Requirements and non-goals

- `su3-top-app-bar`: a bar at the top of a page with a `navigation` slot (a leading control such as
  a menu icon button), a default slot for the title and an `actions` slot (trailing icon buttons).
- `variant`: `small` (default, one row, title at the start), `center` (title centered) and `large`
  (two rows: the controls first, a larger title below).
- `sticky` keeps the bar at the top of the viewport while the page scrolls. `elevate-on-scroll`
  raises the bar (raised surface color and `elevation-2`) while the window is scrolled; `scrolled`
  reflects that state and is public so it can also be set from code or a story.
- Non-goals: collapsing or hiding on scroll, a search mode, scroll containers other than the
  window, a contextual action bar.

## Technical approach and key decisions

1. One new component directory `navigation/top-app-bar` (five files). Tag `su3-top-app-bar`, class
   `Su3TopAppBar`.
2. The shadow root renders a `<header>` (the banner landmark of a page) with three regions. The
   title is not wrapped in a heading: the application puts plain text or its own `h1` in the
   default slot, which the bar styles through `::slotted`. Documented in the JSDoc.
3. `scrolled` is set from a passive `scroll` listener on the window while `elevate-on-scroll` is
   set (`scrollY > 0`), and checked once when the option is turned on.
4. Hooks `--su3-comp-top-app-bar-*` (container color, scrolled container color, title color,
   elevation, height); no new sys tokens. The background and shadow change with a short transition
   that reduced motion removes; forced colors get a bottom border.
5. Controls in the slots are the application's own elements; the bar only lays them out and gives
   the leading and trailing slots a gap.

## Affected files and directories

New `src/shared/components/navigation/top-app-bar/` (five files). Modified: `src/shared/all.ts`,
`src/shared/index.ts`, `package.json` `exports`, a new changeset, `docs/project_plan.md`,
`docs/design/design-language.md`, new VRT baselines. Story title `Navigation/Top App Bar`; clean URL
`/{productId}/c/navigation/top-app-bar`. No existing baseline changes; README unchanged.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- Three variants without scroll collapsing: the large title does not shrink on scroll.
- Only window scrolling is observed; an app with its own scroll container sets `scrolled` itself.
- `scrolled` is a public reflected property instead of private state.
