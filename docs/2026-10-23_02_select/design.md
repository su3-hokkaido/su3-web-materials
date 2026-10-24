# Select

## Background

`docs/project_plan.md` section 14 item 9, fifth of the components that remain after the MVP (order:
tooltip, top app bar, dialog, menu, select, date picker, time picker, data table). The select
builds on the popup mechanics of the menu and on the field look of the text field. It belongs to the
`inputs` category. This task also extracts the shared groundwork the select, the date picker and the
time picker need (see the technical approach).

## Requirements and non-goals

- `su3-select` and `su3-option`: a form-associated single-choice control. Attributes: `value`,
  `name`, `required`, `disabled`, `label`, `placeholder`, `variant` (`outlined`, `filled`),
  `supporting-text`, `error-text`, `open`. Options are `su3-option` children with `value`,
  `disabled` and `selected` (the initial choice).
- A button shows the chosen option's text (or the placeholder); activating it opens a listbox below
  the field (above when there is no room) at least as wide as the field. A press outside, Escape and
  Tab close it; Escape, a selection and the button toggle return focus to the button.
- Keyboard: Enter, Space, ArrowDown and ArrowUp open on the chosen option (the first for ArrowDown,
  the last for ArrowUp when nothing is chosen); inside, arrows with wrap-around, Home, End,
  typeahead, Enter and Space choose; disabled options are skipped.
- Choosing another option fires `input` then `change` on the select. `required` gives
  `valueMissing`; the error shows after the user leaves the field or a submit fails (or whenever
  `error-text` is set), like the text field. Reset returns to the option marked `selected`; a state
  restore applies the saved value.
- Non-goals: multiple selection, option groups, search or filtering, free text entry, rendering
  anything but text and a leading icon in an option.

## Technical approach and key decisions

1. Two component directories `inputs/select` and `inputs/option` (five files each); the select's
   `index.ts` imports the option's.
2. Semantics: the control is a `<button aria-haspopup="listbox" aria-expanded>` labelled by the
   visible label and the shown value (`aria-labelledby`), the popup is a `popover="manual"` surface
   with `role="listbox"`, and each option sets `role="option"`, `aria-selected` and `aria-disabled`
   as attributes on its host (like the menu item). Focus moves onto the options (roving), so no
   `aria-activedescendant` has to cross the shadow boundary. This is the collapsible dropdown
   listbox pattern rather than the select-only combobox pattern, because an id reference from the
   shadow root to light DOM options is not possible.
3. Shared groundwork, extracted because three components need it and the menu already had it:
   `placePopup` (`behaviors/popup-position.ts`: below or above, start or end alignment, flip, clamp,
   optional minimum width), `PopupController` (`behaviors/popup-controller.ts`: showing and hiding
   the popover from `open`, placement that follows scroll, resize and size changes, outside-press
   detection) and `Typeahead` (`behaviors/typeahead.ts`). The menu now uses them, with its tests as
   the safety net; the tooltip keeps its own four-side code. The field look lives in
   `styles/field-frame.ts` (`fieldFrame(prefix)`), used by the select and the two pickers; the text
   field keeps its own styles so its baselines do not move.
4. Value model: `value` is derived from the options. The first slot change applies a `value` set
   earlier or else the option marked `selected` (whose value is also the reset value); later `value`
   changes choose the matching option and an unknown value clears the choice. A form value is set
   only while something is chosen.
5. Hooks `--su3-comp-select-*` (container color, border color, text color, label color, error color,
   height, container shape, popup color, shape and elevation, offset, focus ring) and
   `--su3-comp-select-option-*` for the options; no new sys tokens.

## Affected files and directories

New `src/shared/components/inputs/select/`, `.../option/`, `src/shared/behaviors/popup-position.ts`,
`popup-controller.ts`, `typeahead.ts` and `src/shared/styles/field-frame.ts`. Modified: the menu (to
use the shared code), `src/shared/behaviors/index.ts`, `src/shared/styles/index.ts`,
`src/shared/all.ts`, `src/shared/index.ts`, `package.json` `exports`, a new changeset,
`docs/project_plan.md`, `docs/design/design-language.md`, new VRT baselines. Story titles
`Inputs/Select` and `Inputs/Option`; clean URLs `/{productId}/c/inputs/select` and
`/{productId}/c/inputs/option`. No existing baseline changes; README unchanged.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- The collapsible dropdown listbox pattern with focus on options, for the shadow boundary reason.
- Extracting the popup code and the field frame now, and refactoring the menu onto it.
- No search and no multiple selection in this version.
- A `su3-option` marked `selected` is only the initial choice; the select owns the choice.
