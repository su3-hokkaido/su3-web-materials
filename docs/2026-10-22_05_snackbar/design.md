# Snackbar

## Background

`docs/project_plan.md` section 14 item 9: post-MVP components, one task each. Navigation bar is done;
the snackbar is next. It is the first component that uses the top layer and a live region.

## Requirements and non-goals

- `su3-snackbar`: a short message at the bottom of the viewport with an optional action and an
  optional close button.
- Controlled by the `open` attribute; closes itself after `duration` milliseconds (default 4000;
  `0` keeps it open until the user or the application closes it) and fires `close`.
- Non-goals: a queue or a global `show()` API (the application decides which message is next),
  stacking several snackbars, swipe to dismiss, placement options other than bottom center.

## Technical approach and key decisions

1. A `LitElement` whose shadow root holds the surface; the surface uses the Popover API
   (`popover="manual"`, `showPopover()` / `hidePopover()` driven by `open`) so it sits in the top
   layer and needs no z-index. Where the API is missing the surface is shown with fixed
   positioning.
2. Accessibility: the message is a polite live region (`role="status"`), so it is announced without
   taking focus. The action is a slotted `su3-button` or any button in the `action` slot and stays
   reachable by keyboard while the snackbar is open. The close button (`dismissible`) has an
   accessible name from a `close-label` property (default `Close`).
3. Timing: the timer starts when the snackbar opens and pauses while the pointer is over it or focus
   is inside it, then restarts with the full duration. `duration="0"` disables it.
4. Events: `close` fires when the snackbar closes for any reason, with `detail.reason` set to
   `timeout`, `dismiss` or `action` (the click on the action slot closes it). Setting `open` to
   `false` from outside fires no event.
5. Styles: tokens only, hooks `--su3-comp-snackbar-*` (container color, label color, shape, max
   width, offset from the viewport edge, action color), inverse colors by default through existing
   color roles; enter and exit use `motion` tokens; reduced motion removes them; forced colors draw
   a border.

## Affected files and directories

New `src/shared/components/feedback/snackbar/` (five files). Modified: `src/shared/all.ts`,
`src/shared/index.ts`, `package.json` `exports` (`make sync-exports`), a new changeset,
`docs/project_plan.md`, `docs/design/design-language.md`, new VRT baselines (the story shows the
snackbar open). Story title `Feedback/Snackbar`; clean URL `/{productId}/c/feedback/snackbar`. No
existing baseline changes; README unchanged; `custom-elements.json` gains the element. A new sys
token is added only if the inverse surface colors cannot be expressed with existing roles.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- The element, not a function, is the API; queues belong to the application.
- A polite `status` role for every snackbar, including errors, because an alert would interrupt the
  user for a transient message; revisit if an `error` tone is added later.
- Pausing the timer on hover and focus is required so keyboard and pointer users can reach the
  action.
