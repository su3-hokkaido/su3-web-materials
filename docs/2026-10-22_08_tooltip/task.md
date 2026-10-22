# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Scaffold `su3-tooltip` (element, styles, story, tests, `index.ts`) with show/hide, delay,
      focus, Escape and hover-on-tooltip behavior
- [x] Add placement, flip and viewport clamping with tests
- [x] Wire the exports (`all.ts`, `index.ts`, `make sync-exports`), review the VRT baselines and run
      axe, the package check and the consumer check
- [x] Record the decisions (plan sections 14 and 17, design language, changeset) and run `make ci`
- [x] Run the `component-reviewer` agent and fix its findings (Escape on hover, disabled sync,
      press on the tooltip, stale aria ids, rAF throttling)
