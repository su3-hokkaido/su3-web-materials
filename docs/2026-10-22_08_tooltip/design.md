# Tooltip

## Background

`docs/project_plan.md` section 14 item 9 lists what remains after the MVP: Tooltip, Top app bar,
Select, Dialog, Menu, then date and time pickers and Data table. They are done one task at a time;
the order is 08 tooltip, 09 top-app-bar, 10 dialog (before the menu and select because the native
dialog work of the drawer carries over), 11 menu, 12 select (reuses the menu), 13 date-picker, 14
time-picker, 15 data-table. The tooltip is first, in the `feedback` category next to the snackbar.

## Requirements and non-goals

- `su3-tooltip` wraps one trigger (default slot) and a plain-text description (the `content` slot,
  a light DOM element).
- It shows on pointer hover after `delay` (default 500 ms) and on keyboard focus of the trigger, and
  hides on pointer leave, blur, Escape and a press on the trigger. It stays open while the pointer
  is over the tooltip itself (WCAG 1.4.13: dismissible, hoverable, persistent).
- `placement` is `top` (default), `bottom`, `start` or `end`; it flips to the opposite side when it
  does not fit and is clamped to the viewport.
- `open` shows it programmatically (and is reflected while shown); `disabled` suppresses it.
- Non-goals: rich tooltips with actions, touch long-press, a delay shared between tooltips, an arrow
  caret, CSS anchor positioning.

## Technical approach and key decisions

1. One new component directory `feedback/tooltip` (five files). Tag `su3-tooltip`, class
   `Su3Tooltip`.
2. The surface is a `popover="manual"` element, so it is in the top layer like the snackbar. It is
   positioned by a small measurement function (trigger rect, surface rect, placement, flip, clamp)
   instead of CSS anchor positioning, which is not available in every supported browser. Placement
   is recomputed on open, on window resize and on scroll while open.
3. Accessibility: the surface has `role="tooltip"`. The slotted `content` element gets an id when it
   has none and the tooltip sets `aria-describedby` on the first element of the default slot. Ids
   cannot cross a shadow boundary, so this does not reach the inner control of a shadow-based
   trigger such as `su3-button`; the tooltip is therefore supplementary text and the trigger must
   keep its own accessible name. Documented in the JSDoc and the design language.
4. The tooltip listens for `pointerenter` / `pointerleave` on the host and the surface, `focusin` /
   `focusout` on the host, and `keydown` Escape on the host. A single pending timer implements the
   delay; leaving cancels it and starts a short grace period so the pointer can move onto the
   surface.
5. No `open` / `close` events: the state is the `open` property, and the tooltip is not a control.
6. Hooks `--su3-comp-tooltip-*` (container color, label color, shape, max-width, offset,
   elevation). The inverse surface like the snackbar (`text` as container, `surface` as label); no
   new sys tokens. The fade is removed under reduced motion; forced colors get a border.

## Affected files and directories

New `src/shared/components/feedback/tooltip/` (five files). Modified: `src/shared/all.ts`,
`src/shared/index.ts`, `package.json` `exports`, a new changeset, `docs/project_plan.md`,
`docs/design/design-language.md`, new VRT baselines. Story title `Feedback/Tooltip`; clean URL
`/{productId}/c/feedback/tooltip`. No existing baseline changes; README unchanged.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- A wrapper element with a light DOM `content` slot instead of a `for` id reference, because ids do
  not cross shadow roots.
- Measured placement in JavaScript instead of CSS anchor positioning.
- No delay shared between tooltips; each one has its own.
