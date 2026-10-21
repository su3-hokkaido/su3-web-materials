# Tasks

Each item maps to one commit. Check items off as they complete.

- [x] Add `deploy/cloudflare/deploy.ts` and `deploy-lib.ts` with unit tests (and an end-to-end test
      with a stubbed `pnpm`), replace `deploy.sh`, and extend the Vitest Node project
- [x] Rework `_deploy.yml`, `deploy_dev.yml`, `deploy_prod.yml` and `ci.yml` (Workers deploy,
      `workflow_call` gating, Chromium on the runner)
- [x] Add `consumers.yml` and touch up `vrt.yml`
- [x] Add Changesets (dependency, `changeset` and `release` scripts, Makefile targets, initial
      changeset, `CHANGELOG.md` reset) and adjust `release.yml`
- [x] Add the workflow convention tests, mutation-check them and validate the workflows with
      `actionlint`
- [x] Housekeeping (issue template, `CLAUDE.md`), then record the decisions and the owner's setup in
      `docs/project_plan.md` sections 2, 4, 8, 9, 14, 15 and 17 and run `make ci`
