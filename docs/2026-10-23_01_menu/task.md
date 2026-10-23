# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Forward `aria-haspopup` and `aria-expanded` in `su3-button` and `su3-icon-button` with tests
- [x] Add `su3-menu-item` (element, styles, story, tests, `index.ts`)
- [x] Add `su3-menu` (element, styles, story, tests, `index.ts`) with the popup, trigger and
      placement
- [x] Add the keyboard behavior (arrows, Home and End, typeahead, Escape, Tab) with tests
- [x] Wire the exports (`all.ts`, `index.ts`, `make sync-exports`), review the VRT baselines and run
      axe, the package check and the consumer check
- [x] Record the decisions (plan sections 14 and 17, design language, changeset) and run `make ci`
- [x] Run the `component-reviewer` agent and fix its findings (reduced motion, close on removal,
      Escape with only disabled items)
