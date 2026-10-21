# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Add the shared style fragments (`src/shared/styles/`) and the new system size tokens, refactor
      the Button onto them (its VRT baselines must not change) and test the fragments
- [x] Extend `FormAssociatedElement` (validity API, `setValidityState`, reset and restore hooks,
      `accessibleName`) and test it, keeping the Button and the base-class tests green
- [x] Add `FormCheckableElement` and `su3-checkbox` (element, styles, stories, tests)
- [x] Add `su3-switch`
- [x] Add `su3-text-field`
- [x] Add `su3-icon-button`
- [x] Add `su3-divider`
- [x] Sync `all.ts` and `exports`, extend the conventions tests, create and review the VRT
      baselines, run axe over every story, and re-run the package and consumer checks
- [x] Record the decisions (plan sections 3, 14 and 17, design language, `CLAUDE.md`, the changeset)
      and run `make ci`
