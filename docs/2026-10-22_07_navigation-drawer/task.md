# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Add the `layout` property (`stacked` | `inline`) to `su3-navigation-item` with tests; existing
      baselines must not change
- [x] Add `su3-navigation-drawer` (element, styles, story, tests, `index.ts`) with standard and modal
      modes
- [x] Wire the exports (`all.ts`, `index.ts`, `make sync-exports`), review the VRT baselines and run
      axe, the package check and the consumer check
- [x] Record the decisions (plan sections 14 and 17, design language, changeset) and run `make ci`
- [x] Run the `component-reviewer` agent and fix its findings (modal host height, `open` sync on
      dialog close, single accessible name, initial focus, more tests)
