# Time picker

## Background

`docs/project_plan.md` section 14 item 9, seventh of the components that remain after the MVP (order:
tooltip, top app bar, dialog, menu, select, date picker, time picker, data table). It reuses the
popup groundwork and the field frame extracted for the select and follows the date picker's
structure (`docs/2026-10-23_03_date-picker/`). It belongs to the `inputs` category.

## Requirements and non-goals

- `su3-time-picker`: a form-associated time control. `value` is a 24-hour time (`HH:mm`, empty when
  nothing is chosen); `min` and `max` limit the choice; `step` (minutes, default 5, a divisor of 60)
  sets the minutes offered; also `name`, `required`, `disabled`, `label`, `placeholder`, `variant`,
  `supporting-text`, `error-text`, `locale`, `hour-cycle` (`12`, `24` or empty for the locale's
  clock), `hours-label`, `minutes-label`, `period-label`, `open` and `inline`.
- The field is a button that shows the chosen time or the placeholder and opens a popup below it
  (above when there is no room) with one list of options per part of the time: hours, minutes and,
  on a 12-hour clock, AM or PM. With `inline` only the lists are rendered.
- Choosing an option sets the time at once and fires `input` then `change`; a part not chosen yet is
  taken as 0 (12 AM), and while nothing is chosen the first hour that has a minute in range is used.
  The popup closes (and focus returns to the button) after the last list is used: minutes on a
  24-hour clock, AM or PM on a 12-hour clock. Options that would give a time outside `min` and `max`
  are shown but cannot be chosen; choosing an hour that cannot keep the current minute moves to its
  first allowed minute.
- Keyboard: ArrowDown and ArrowUp on the button open the popup; inside a list ArrowUp and ArrowDown
  move (stopping at the ends), Home and End jump, ArrowLeft and ArrowRight move to the neighbouring
  list (mirrored in right-to-left text), Enter and Space choose, Escape closes. Each list is one tab
  stop, on its chosen option or else its first enabled one.
- Validation: `valueMissing`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch` (a minute off the
  step) and `badInput`. The error shows after the user leaves the field or a submit fails, or whenever
  `error-text` is set. Reset returns to the `value` attribute; a state restore applies the saved value.
- Non-goals: seconds, a clock face, typing a time, time zones, a date.

## Technical approach and key decisions

1. One new component directory `inputs/time-picker` (five files). The time arithmetic is a pure
   module, `src/shared/behaviors/time-of-day.ts` (parse, format, 12-hour mapping, step helpers,
   locale clock), with unit tests; it sits next to the other shared behaviors because a component
   directory holds exactly five files.
2. The popup uses `PopupController`; the field look uses `fieldFrame('time-picker')`.
3. Semantics: the field button has `aria-haspopup="dialog"` and is named by the label and the shown
   value; the popup is a `popover="manual"` `role="dialog"` named by the label; each list is a
   `role="listbox"` named by `hours-label`, `minutes-label` or `period-label`, whose options are
   `<button role="option">` with `aria-selected` and `aria-disabled` (so a disabled option keeps its
   place for the keyboard). The list names are attributes because the component ships no
   translations. Required and invalid states are conveyed through `aria-describedby` text.
4. Choices are applied from the time as it is when the choice happens, not as it was when the list
   was drawn, so two quick choices cannot undo each other.
5. Values are plain hours and minutes; the 12-hour clock is a presentation of the same value (12 AM
   is 00, 12 PM is 12). The format of the button follows `locale` and `hour-cycle`.
6. Hooks `--su3-comp-time-picker-*` (the field hooks of `fieldFrame`, the popup, the chosen option);
   no new sys tokens. Forced colors use Highlight for the chosen option; reduced motion removes the
   transitions.

## Affected files and directories

New `src/shared/components/inputs/time-picker/` and `src/shared/behaviors/time-of-day.ts` with its
test. Modified: `src/shared/behaviors/index.ts`, `src/shared/all.ts`, `src/shared/index.ts`,
`package.json` `exports`, a new changeset, `docs/project_plan.md`, `docs/design/design-language.md`,
new VRT baselines. Story title `Inputs/Time Picker`; clean URL `/{productId}/c/inputs/time-picker`.
The stories use fixed times so the screenshots do not depend on the clock. No existing baseline
changes; README unchanged.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- Every choice commits at once, instead of a confirm and cancel step.
- Lists of options instead of a typed input or a clock face.
- Labels for the lists are attributes, not built-in translations.
- The time helpers are in `behaviors/` because a component directory holds exactly five files.
