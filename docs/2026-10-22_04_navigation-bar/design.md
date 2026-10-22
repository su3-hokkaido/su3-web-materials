# Navigation bar

## Background

`docs/project_plan.md` section 14 item 9: post-MVP components, one task each. Card, Badge and
Segmented button are done; the navigation bar is next. Navigation rail and drawer are separate later
tasks and are out of scope here.

## Requirements and non-goals

- `su3-navigation-bar` (the container) and `su3-navigation-item` (one destination): a row of 3 to 5
  equal-width destinations, each with an icon, an always-visible label and an optional badge.
- The selected item shows a pill indicator behind its icon. One item is selected at a time; the bar
  never deselects.
- An item is a link when `href` is set and a button otherwise. The bar fires `change` when the user
  selects another item.
- Non-goals: rail and drawer layouts, responsive switching between layouts, routing (the application
  owns navigation and sets `selected`), hide-on-scroll behavior, vertical orientation.

## Technical approach and key decisions

1. Two component directories under a new category `navigation`
   (`navigation/navigation-bar`, `navigation/navigation-item`), as for the segmented button. The
   bar's `index.ts` also imports the item's, so `navigation-bar.js` registers both.
2. Item: a native `<a>` (with `href`) or `<button>` in the shadow root; `selected` sets
   `aria-current="page"`. Slots: `icon`, default (label) and `badge`. The pill indicator is a
   pseudo-element-free `span` behind the icon slot. State layer and focus ring reuse
   `src/shared/styles/`; there is no touch-target fragment because the whole item (about 64px tall)
   is the hit area.
3. Bar: a `<nav>` named by `aria-label` on the host, containing the slotted items. All items are
   tab stops (these are links or buttons, not a radio group), so there is no roving tabindex.
4. Selection lives on the items (`selected`); the bar derives `value` from the selected item and
   applies a `value` set from outside, like the segmented button. Items tell the bar about
   `selected` / `disabled` changes with an internal `su3-navigation-item-change` event.
5. Click handling is on the bar, once. A click on a link item lets the browser navigate unless the
   application cancels it.
6. Hooks `--su3-comp-navigation-bar-*` (container and border color, indicator color and shape, label
   and icon colors, focus ring), read by the items too so one prefix themes the whole bar; the height
   follows the item content and has no hook, each read with a `--su3-sys-*` fallback and a built-in default; no new
   sys tokens expected. Reduced motion and forced colors are handled (the selected indicator gets a
   border and `Highlight` colors when forced).

## Affected files and directories

New `src/shared/components/navigation/navigation-bar/` and `.../navigation-item/` (ten files).
Modified: `src/shared/all.ts`, `src/shared/index.ts`, `package.json` `exports` (`make sync-exports`),
a new changeset, `docs/project_plan.md`, `docs/design/design-language.md`, new VRT baselines. Story
titles `Navigation/Navigation Bar` and `Navigation/Navigation Item`; clean URLs
`/{productId}/c/navigation/navigation-bar` and `.../navigation-item`. No existing baseline changes;
README unchanged; `custom-elements.json` gains both elements.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- Two elements with the bar doing the event handling, for the same reason as the segmented button.
- Links when `href` is present, buttons otherwise; the bar only reflects `selected`.
- `aria-current="page"` and plain tab order rather than radio semantics, because this is
  navigation.
- No responsive behavior; layout is a flexible row of equal-width items.
