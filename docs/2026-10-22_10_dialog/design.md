# Dialog

## Background

`docs/project_plan.md` section 14 item 9, third of the components that remain after the MVP (order:
tooltip, top app bar, dialog, menu, select, date picker, time picker, data table; the dialog and the
menu move ahead of the select, which builds on them, a reordering of the list in section 14). The
dialog reuses the native `<dialog>` approach proven in the navigation drawer. Category `feedback`.

## Requirements and non-goals

- `su3-dialog`: a modal dialog with the slots `headline`, default (the content) and `actions`.
- `open` shows it. `persistent` makes Escape and a scrim click do nothing, for a confirmation that
  must be answered. `alert` gives the `alertdialog` role. `fullscreen` fills the viewport; the
  application decides when to use it (for example on small screens).
- Closing fires `close` (bubbles, not composed) with `detail.reason`: `escape`, `scrim` or
  `action`. For `action`, `detail.action` is the value of the `dialog-action` attribute of the
  element that was activated in the `actions` slot; any element with that attribute that is not
  disabled, such as a `su3-button`, closes the dialog when it is clicked. Setting `open` to `false`
  from outside fires no event.
- Non-goals: built-in confirm and cancel buttons, nested dialogs, dragging or resizing, body scroll
  lock (the top layer makes the page inert, but the wheel may still scroll it).

## Technical approach and key decisions

1. One new component directory `feedback/dialog` (five files). Tag `su3-dialog`, class `Su3Dialog`.
2. A native `<dialog>` opened with `showModal()` and closed with `close()` from `open`, which gives
   the top layer, the scrim (`::backdrop`), the focus trap, Escape and focus return to the opener.
3. The dialog box carries the surface (color, shape, elevation) and a `.panel` fills it, so a click
   whose target is the dialog itself can only be a click on the scrim. The content scrolls within
   the maximum height.
4. Name: the dialog is labelled by an `<h2>` in the shadow root that slots the headline
   (`aria-labelledby` stays inside one tree); with no headline the host `aria-label` names it.
5. Focus: on open an element with `autofocus` in the content takes focus, otherwise the browser
   picks the first focusable element.
6. The `cancel` event (Escape) is always prevented and handled by the element: it closes with the
   reason `escape` unless `persistent`. A browser close without a cancelable `cancel` is mirrored
   into `open` so the state never lags.
7. Hooks `--su3-comp-dialog-*` (container color, scrim color, shape, max-width, elevation, headline
   color); no new sys tokens. Enter and exit use `@starting-style` and `allow-discrete` transitions
   like the drawer; reduced motion zeroes the duration tokens; forced colors get a border.

## Affected files and directories

New `src/shared/components/feedback/dialog/` (five files). Modified: `src/shared/all.ts`,
`src/shared/index.ts`, `package.json` `exports`, a new changeset, `docs/project_plan.md`,
`docs/design/design-language.md`, new VRT baselines. Story title `Feedback/Dialog`; clean URL
`/{productId}/c/feedback/dialog`. No existing baseline changes; README unchanged.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- A `dialog-action` attribute convention instead of a default-button convention, so any control can
  be an action and the application keeps its own buttons.
- `persistent` as an explicit flag instead of inferring it from `alert`.
- No scroll lock.
