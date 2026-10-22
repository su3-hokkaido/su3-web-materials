# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Decide on and, if worthwhile, extract the shared selection behavior used by the bar and the
      rail (the bar's tests must stay green)
- [x] Add `su3-navigation-rail` (element, styles, story, tests, `index.ts`)
- [x] Wire the exports (`all.ts`, `index.ts`, `make sync-exports`), review the VRT baselines and run
      axe, the package check and the consumer check
- [x] Record the decisions (plan sections 14 and 17, design language, changeset) and run `make ci`
- [x] Run the `component-reviewer` agent and fix its findings (base class `@fires`, no cast,
      deselect test); VRT baselines are generated with the drawer's
