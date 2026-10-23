# Menu

## Background

`docs/project_plan.md` section 14 item 9, fourth of the components that remain after the MVP (order:
tooltip, top app bar, dialog, menu, select, date picker, time picker, data table; the dialog and the
menu move ahead of the select, which builds on the same popup mechanics). Tooltip, top app bar and
dialog are done. The menu belongs to the `navigation` category.

## Requirements and non-goals

- Two elements: `su3-menu` (the popup and its behavior) and `su3-menu-item` (one command). The menu
  has a `trigger` slot (the control that opens it) and a default slot for the items; other children
  such as a `su3-divider` are allowed and skipped by keyboard navigation.
- `su3-menu`: `open` and `placement` (`bottom-start` default, `bottom-end`, `top-start`,
  `top-end`; flips to the other side when it does not fit and stays inside the viewport). A click on
  the trigger toggles it. A press outside, Escape and Tab close it; Escape and a selection return
  focus to the trigger.
- Keyboard: ArrowDown and ArrowUp on the trigger open the menu with the first or last item focused;
  inside, the arrow keys move with wrap-around, Home and End jump, typing a letter moves to the next
  item whose label starts with the typed text (the buffer resets after one second), Enter and Space
  activate. Disabled items are skipped.
- `su3-menu-item`: `value`, `disabled`, `checkable` and `checked` (role `menuitemcheckbox` with a
  check mark). Slots: default (label), `leading` (icon) and `trailing` (for example a shortcut).
- The menu fires `select` (detail `{ value, item }`) when an item is activated and then closes
  with `close` (detail `{ reason }`: `select`, `escape`, `outside`, `tab` or `trigger`). A checkable item
  toggles its own `checked` before `select`. Setting `open` to `false` from outside fires no event.
- Non-goals: submenus, context menus, radio groups, items that are links, menus inside menus,
  virtualised long lists (a long menu scrolls).

## Technical approach and key decisions

1. Two new component directories `navigation/menu` and `navigation/menu-item` (five files each).
   The menu's `index.ts` imports the item's, like the bar imports its items.
2. The popup is a `popover="manual"` element with `role="menu"` in the shadow root and the slotted
   items as its owned `menuitem`s; the top layer, outside-press detection and focus are handled by
   the element. Placement uses the measurement approach of the tooltip (trigger rect, surface rect,
   flip, clamp) kept as a private copy: the two differ in alignment and a shared helper would be
   mostly parameters.
3. The item is itself the focus target: the element sets `role` (`menuitem` or
   `menuitemcheckbox`), `aria-checked` and `aria-disabled` as attributes on the host (explicit
   attributes rather than `ElementInternals`, so every tool sees them), and the menu keeps a roving `tabindex` (`-1` on every item, focus moved programmatically). There is no inner
   control, so there is no shadow boundary between the role and the focus.
4. The trigger is described with `aria-haspopup="menu"` and `aria-expanded`. Those attributes would
   not reach the inner control of `su3-button` and `su3-icon-button`, so both are extended to
   forward `aria-haspopup` and `aria-expanded` from the host to the inner control, like
   `aria-label` (an additive change in `FormSubmitterElement`, with tests; no baseline changes).
5. Hooks `--su3-comp-menu-*` (container color, shape, elevation, min-width, label color, focus
   ring); the item draws hover, focus and pressed through the shared state layer fragment; no new
   sys tokens. Forced colors get a border and a Highlight outline on the focused item; reduced
   motion comes from the zeroed duration tokens.
6. Typeahead compares the lower-cased label text (the item's own text, not its `leading` and
   `trailing` slots); repeating the same letter cycles through matches.

## Affected files and directories

New `src/shared/components/navigation/menu/` and `.../menu-item/` (five files each). Modified:
`src/shared/behaviors/form-submitter.ts`, `button.ts` and `icon-button.ts` (the forwarding and
their tests), `src/shared/all.ts`, `src/shared/index.ts`, `package.json` `exports`, a new
changeset, `docs/project_plan.md`, `docs/design/design-language.md`, new VRT baselines. Story titles
`Navigation/Menu` and `Navigation/Menu Item`; clean URLs `/{productId}/c/navigation/menu` and
`/{productId}/c/navigation/menu-item`. No existing baseline changes; README unchanged.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- Forwarding `aria-haspopup` and `aria-expanded` in the two buttons instead of a menu-specific
  trigger element.
- No submenus and no link items in this version; `checkable` is an explicit flag.
- The item is the focus target with its role as host attributes, not a wrapper around an inner
  `<button>`.
- Placement code is kept private to the menu instead of being shared with the tooltip.
