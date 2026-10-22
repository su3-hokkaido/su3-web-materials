# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Scaffold `su3-snackbar` (element, styles, story, tests, `index.ts`) with the open/close, timer
      and live-region behavior
- [x] Wire the exports (`all.ts`, `index.ts`, `make sync-exports`), review the VRT baselines and run
      axe, the package check and the consumer check
- [x] Record the decisions (plan sections 14 and 17, design language, changeset) and run `make ci`
- [x] Run the `component-reviewer` agent and fix its findings (NaN duration, reconnect, disabled
      action, Escape, public type JSDoc, test cleanups)
- [x] Run `make vrt-update` (Docker) for the missing shared/mobile baselines and review the images
