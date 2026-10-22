# Navigation drawer

## Background

`docs/project_plan.md` section 14 item 9: post-MVP components, one task each. The navigation bar
and rail are done; the drawer is the third navigation container and the first component with a modal
mode. It depends on `docs/2026-10-22_06_navigation-rail/` being merged.

## Requirements and non-goals

- `su3-navigation-drawer`: a panel of `su3-navigation-item` destinations with the label beside the
  icon, an optional `header` slot and optional section headings.
- Two modes: standard (always visible, part of the layout) and `modal` (a panel over the page with a
  scrim, opened with `open`, closed by Esc, a scrim click or a selection when `close-on-select` is
  set).
- Same selection model as the bar and rail: `value`, `change`, `aria-current="page"`.
- Non-goals: responsive switching between modes, swipe gestures, a resizable or collapsible
  standard drawer, a right-hand drawer.

## Technical approach and key decisions

1. `su3-navigation-item` gains `layout` (`stacked` default, `inline`). The drawer sets `inline` on
   its items; the item then draws the label beside the icon, with the pill covering the whole row.
   Default behavior and existing baselines do not change.
2. Modal mode renders a native `<dialog>` and calls `showModal()` / `close()` from `open`, which
   gives the scrim (`::backdrop`), the focus trap, Esc handling and the top layer without custom
   code. A `close` event on the drawer mirrors the dialog's, with `detail.reason`. Standard mode
   renders the same `<nav>` without a dialog.
3. Focus: on open the first selected (or first enabled) item takes focus; on close focus returns to
   the element that opened the drawer, which the native dialog restores.
4. Section headings: no new component. The drawer styles slotted `h2`, `h3` and `h4` elements as
   section headings (`::slotted(:is(h2, h3, h4))`) and leaves them out of selection, because only
   `su3-navigation-item` children take part in it. Recorded as a judgment call.
5. Hooks `--su3-comp-navigation-drawer-*` (container color, width, scrim color, shape of the modal
   edge, heading color); scrim uses the existing `overlay` color role; enter and exit use motion
   tokens and are removed under reduced motion; forced colors get a border.

## Affected files and directories

New `src/shared/components/navigation/navigation-drawer/` (five files). Modified:
`src/shared/components/navigation/navigation-item/` (the `layout` property, styles and tests),
`src/shared/all.ts`, `src/shared/index.ts`, `package.json` `exports`, a new changeset,
`docs/project_plan.md`, `docs/design/design-language.md`, new VRT baselines. Story title
`Navigation/Navigation Drawer`; clean URL `/{productId}/c/navigation/navigation-drawer`. No
existing baseline changes expected (stacked layout stays the default); README unchanged.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- A native `<dialog>` for the modal mode instead of a hand-written focus trap.
- Headings are plain slotted heading elements, not a new component.
- The item's `layout` property instead of a separate drawer item, to keep one themable item.
