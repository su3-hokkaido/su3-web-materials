# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Scaffold `su3-dialog` (element, styles, story, tests, `index.ts`) with open/close, the slots
      and the accessible name
- [x] Add the close reasons, `dialog-action` actions, `persistent`, `alert` and `fullscreen` with
      tests
- [x] Wire the exports (`all.ts`, `index.ts`, `make sync-exports`), review the VRT baselines and run
      axe, the package check and the consumer check
- [x] Record the decisions (plan sections 14 and 17, design language, changeset) and run `make ci`
- [x] Run the `component-reviewer` agent and fix its findings (`@fires` wording, story markup);
      VRT baselines wait for Docker
