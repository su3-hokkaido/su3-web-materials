# Date picker

## Background

`docs/project_plan.md` section 14 item 9, sixth of the components that remain after the MVP (order:
tooltip, top app bar, dialog, menu, select, date picker, time picker, data table). It reuses the
popup groundwork and the field frame extracted for the select (`docs/2026-10-23_02_select/`) and
belongs to the `inputs` category.

## Requirements and non-goals

- `su3-date-picker`: a form-associated date control. `value` is an ISO calendar date
  (`YYYY-MM-DD`, empty when nothing is chosen); `min` and `max` limit the choice; also `name`,
  `required`, `disabled`, `label`, `placeholder`, `variant`, `supporting-text`, `error-text`, `locale`,
  `first-day-of-week`, `previous-label`, `next-label`, `open` and `inline`.
- The field is a button that shows the chosen date (`Intl.DateTimeFormat`, medium date style) or the
  placeholder and opens a calendar popup below it (above when there is no room). With `inline` only
  the calendar is rendered, with no field and no popup.
- The calendar shows one month: a heading, previous and next buttons, the weekday names and a grid of
  day buttons. Days outside the month are blank cells; days outside `min` and `max` are shown but
  cannot be chosen; today is marked; the chosen day is marked.
- Keyboard in the grid: arrow keys by day and week, Home and End to the first and last day of the
  week, PageUp and PageDown by month (Shift: by year), Enter and Space choose, Escape closes the popup.
  Movement is kept inside `min` and `max`. Choosing fires `input` then `change`, closes the popup and
  returns focus to the button.
- Validation: `valueMissing`, `rangeUnderflow`, `rangeOverflow` and `badInput` (a value that is not a
  date). The error shows after the user leaves the field or a submit fails, or whenever `error-text`
  is set. Reset returns to the `value` attribute; a state restore applies the saved value.
- Non-goals: ranges, week numbers, typing a date, month and year selection views, non-Gregorian
  calendars, time zones, a time of day.

## Technical approach and key decisions

1. One new component directory `inputs/date-picker` (five files). The date arithmetic is a pure
   module, `src/shared/behaviors/calendar-date.ts` (parse, format, add days and months, compare,
   clamp, weekday, month grid, locale first day), with its own unit tests. Component directories hold
   exactly five files, so the helper lives next to the other shared behaviors.
2. Dates are plain `{ year, month, day }` calendar dates computed with UTC arithmetic on whole days,
   so no time zone or daylight saving change can move a date. "Today" is the user's local date.
3. The popup uses `PopupController`; the field look uses `fieldFrame('date-picker')`.
4. Semantics: the field button has `aria-haspopup="dialog"` and is named by the label and the shown
   value; the popup is a `popover="manual"` `role="dialog"` named by the label; the grid is a native
   `<table role="grid">` named by the month heading, with column headers carrying the full weekday
   names; each day is a `<button>` named by its full date (`dateStyle: 'full'`), with `aria-pressed`
   for the chosen day, `aria-current="date"` for today and `aria-disabled` for days out of range.
   Disabled days use `aria-disabled` rather than `disabled` so they stay focusable and keyboard
   movement does not lose its place. Required and invalid states are conveyed through
   `aria-describedby` text, because a plain button may not carry `aria-required` or `aria-invalid`.
5. Roving focus: the grid has one tab stop, on the focused day, which also decides the month shown.
   The month buttons move the shown month without moving focus into the grid.
6. Names and formats follow `locale` (default: the document language, else the browser's);
   `first-day-of-week` overrides the locale's first day. The month button names are attributes
   (`previous-label`, `next-label`) because the component ships no translations.
7. Hooks `--su3-comp-date-picker-*` (the field hooks of `fieldFrame`, the popup, the chosen day and
   today); no new sys tokens. Forced colors use Highlight for the chosen day; reduced motion removes
   the transitions.

## Affected files and directories

New `src/shared/components/inputs/date-picker/` and `src/shared/behaviors/calendar-date.ts` with its
test. Modified: `src/shared/behaviors/index.ts`, `src/shared/all.ts`, `src/shared/index.ts`,
`package.json` `exports`, a new changeset, `docs/project_plan.md`, `docs/design/design-language.md`,
new VRT baselines. Story title `Inputs/Date Picker`; clean URL `/{productId}/c/inputs/date-picker`.
The stories use fixed dates in 2024 so the screenshots do not depend on today. No existing baseline
changes; README unchanged.

## Provenance

Written for this repository; nothing is taken from material-web or another project.

## Judgment calls

- The calendar and the field are one element (with `inline` for the calendar alone) instead of two.
- Days of the neighbouring months are blank, not interactive.
- Labels for the month buttons are attributes, not built-in translations.
- The date helpers are in `behaviors/` because a component directory holds exactly five files.
