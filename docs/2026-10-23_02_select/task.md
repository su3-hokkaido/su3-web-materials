# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Extract `placePopup`, `PopupController` and `Typeahead` into `behaviors/` and move the menu
      onto them (the menu's tests stay green)
- [x] Add the shared `fieldFrame` style fragment for button-like fields
- [x] Add `su3-option` (element, styles, story, tests, `index.ts`)
- [x] Add `su3-select` (element, styles, story, tests, `index.ts`) with the popup, keyboard,
      form participation and validation
- [x] Wire the exports (`all.ts`, `index.ts`, `make sync-exports`), review the VRT baselines and run
      axe, the package check and the consumer check
- [x] Record the decisions (plan sections 14 and 17, design language, changeset) and run `make ci`
- [x] Run the `component-reviewer` agent and fix its findings
