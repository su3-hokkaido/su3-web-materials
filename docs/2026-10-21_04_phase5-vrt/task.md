# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Add `playwright.config.ts`, the Dockerfile `vrt` stage, the compose `vrt` service and the
      Makefile `vrt` and `vrt-update` targets; run the amd64 feasibility spike and record it
- [x] Add `tests/vrt/stories.ts` (default-product rule, `themed`) with unit tests and extend the
      Node Vitest project
- [x] Add `tests/vrt/site.ts` and `tests/vrt/stories.spec.ts`, mark the Button `Variants` story
      `themed`, and create and review the first baselines
- [x] Add `tests/vrt/media.spec.ts` (reduced motion, forced colors, coarse pointer)
- [x] Extend `src/conventions.test.ts` (stages, compose service, Makefile, `parameters.vrt`) and
      mutation-check it, including a real visual regression and an orphan baseline
- [x] Verify (`make vrt` twice for determinism, `make ci`, `make local-ci`), record the decisions in
      `docs/project_plan.md` sections 11, 14, 15 and 17, and update `CLAUDE.md`
