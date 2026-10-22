# Navigation rail

## Background

`docs/project_plan.md` section 14 item 9: post-MVP components, one task each. The navigation bar is
done; the rail is its vertical counterpart for wider screens. The navigation drawer follows in
`docs/2026-10-22_07_navigation-drawer/`.

## Requirements and non-goals

- `su3-navigation-rail`: a vertical column of `su3-navigation-item` destinations (icon over label,
  exactly as in the bar) with one selected item and an optional `header` slot for a menu button or
  a primary action.
- Same selection model as the bar: `value`, `change`, `aria-current="page"`, plain tab order.
- Non-goals: switching between bar and rail by viewport (the application chooses), expanding the
  rail into a drawer, collapsing labels.

## Technical approach and key decisions

1. One new component directory `navigation/navigation-rail`; `su3-navigation-item` is reused
   unchanged. The rail's `index.ts` imports the item's like the bar's does.
2. A `<nav>` containing an optional `header` slot and a column of the slotted items. The items keep
   equal heights and are centered horizontally.
3. The selection logic of the bar (`#setSelection`, `#syncValue`, click and item-change handling) is
   needed again. If the copy is small it stays in the rail; if it is nearly identical a shared base
   class `NavigationSelectionElement` in `src/shared/behaviors/` is extracted and both the bar and
   the rail extend it, with the bar's tests unchanged as the safety net. Decide while implementing
   and record the result in the plan section 17 entry.
4. Hooks `--su3-comp-navigation-rail-*` (container color, width, border color, item spacing); item
   hooks stay `--su3-comp-navigation-bar-*` as decided for the bar, so one theme works for both.
5. Reduced motion and forced colors need no extra rules beyond the item's.

## Affected files and directories

New `src/shared/components/navigation/navigation-rail/` (five files). Possibly new
`src/shared/behaviors/navigation-selection.ts` and its test. Modified: `src/shared/all.ts`,
`src/shared/index.ts`, `package.json` `exports`, a new changeset, `docs/project_plan.md`,
`docs/design/design-language.md`, new VRT baselines. Story title `Navigation/Navigation Rail`; clean
URL `/{productId}/c/navigation/navigation-rail`. No existing baseline changes; README unchanged.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- Reuse the item and its `navigation-bar-*` hooks instead of a rail-specific item.
- Extract shared selection logic only when the duplication justifies it.
