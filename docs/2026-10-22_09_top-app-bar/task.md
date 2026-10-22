# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Scaffold `su3-top-app-bar` (element, styles, story, tests, `index.ts`) with the slots and the
      `small`, `center` and `large` variants
- [x] Add `sticky` and `elevate-on-scroll` with tests
- [x] Wire the exports (`all.ts`, `index.ts`, `make sync-exports`), review the VRT baselines and run
      axe, the package check and the consumer check
- [x] Record the decisions (plan sections 14 and 17, design language, changeset) and run `make ci`
- [x] Run the `component-reviewer` agent and fix its findings (title ellipsis on the slotted
      element, manual `scrolled` kept on reconnect, elevation edge, more tests); VRT baselines wait
      for Docker
