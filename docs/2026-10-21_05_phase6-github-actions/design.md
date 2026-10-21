# Phase 6: GitHub Actions

## Background

`docs/project_plan.md` section 8 (GitHub Actions), section 9 (package publishing) and section 14
(Phase 6). `.github/` already contains workflows carried over from the owner's template repository,
pinned to commit SHAs: `ci.yml`, `vrt.yml`, `_deploy.yml`, `deploy_dev.yml`, `deploy_prod.yml`,
`create-d2m-pr.yml`, `release.yml`, `actions/setup` and `dependabot.yml`. They still target Cloudflare
Pages, a CI that needs no browser and a package with no release script. This phase adapts them to
this repository and keeps them honest with tests. Claude runs no remote or deploy command; the owner
performs the one-time setup written below.

## Requirements

- CI runs the same checks as `make ci` on every pull request and on every push to `main` and
  `develop`, including the browser tests (Chromium) and the package checks.
- A visual regression workflow runs in the same image as `make vrt`.
- A separate workflow runs the consumer fixtures (network and Chromium).
- Pushes to `develop` and `main` deploy to Cloudflare Workers Static Assets after CI passes:
  `develop` to a persistent preview Worker, `main` to production.
- Merging a pull request with a changeset results in a Version Packages pull request, then a tag, a
  GitHub Release, an npm publish (Trusted Publishing) and a back-merge pull request.
- A fork or template copy with no configuration passes CI and skips deploy and publish.
- Every third-party action is pinned to a full commit SHA with a version comment; permissions are
  minimal.

## Non-goals

Per-pull-request preview deployments (see decision 1), the README (Phase 8), the first npm
publish (a manual step), new components.

## Technical approach and key decisions

### 1. Preview environment (resolves the open item in sections 4 and 8)

Cloudflare's current documentation offers three mechanisms: Previews (`wrangler preview`, branch and
pull-request environments under one Worker), Version URLs (an uploaded version; `--preview-alias` is
not isolated), and Wrangler environments (separately named, persistent Workers, recommended for
development and staging). The requirement is a stable URL that follows `develop`, so `develop`
deploys a **second Worker named `${CLOUDFLARE_WORKER_NAME}-dev`** and `main` deploys
`${CLOUDFLARE_WORKER_NAME}`. Both use `deploy/cloudflare/wrangler.jsonc` with `wrangler deploy
--name`. It is free (the Free plan allows 100 Workers), needs no feature beyond static assets and keeps
the two environments independent. Per-pull-request previews with `wrangler preview` can be added
later without changing this.

### 2. Deploy script

`deploy/cloudflare/deploy.ts` replaces the Pages `deploy.sh`. It reads `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_WORKER_NAME`, takes the environment (`development` or
`production`), checks that `dist/storybook` is complete, runs `pnpm exec wrangler deploy --config
deploy/cloudflare/wrangler.jsonc --name <worker>` with `WRANGLER_OUTPUT_FILE_PATH` set, and prints the
deployed URL from the `deploy` entry of the ND-JSON output (also written to `GITHUB_OUTPUT` as `url`).
The pure parts live in `deploy/cloudflare/deploy-lib.ts` with unit tests (worker name per environment,
environment validation, output parsing). A stubbed `pnpm` on `PATH` tests the script end to end
without network access.

### 3. Guards

`_deploy.yml` skips the deploy job with a notice unless the repository variable
`CLOUDFLARE_WORKER_NAME` is set (a variable, not a secret, because a job's `if` is evaluated before
its environment applies; renamed from the Pages-era `CLOUDFLARE_PROJECT_NAME`). `release.yml`
passes a publish script to Changesets only when `github.repository` equals the repository variable
`NPM_PUBLISH_REPOSITORY`, so a fork that has not renamed the package never attempts to publish it.

### 4. CI gating

`ci.yml` triggers on `pull_request` and `workflow_call` and has no `push` trigger. `deploy_dev.yml`
and `deploy_prod.yml` call it as a `checks` job and run the deploy only with `needs: checks`: a push
to `develop` or `main` runs CI exactly once, and a failing CI blocks the deploy. Forks run CI on push
too, and skip only the deploy job.

### 5. Chromium on the runner

Vitest Browser Mode needs a browser, so the CI and consumer jobs run `pnpm exec playwright install
--with-deps chromium` after the setup action. The VRT job needs no host browser: it builds Storybook
on the runner and runs the compose `vrt` service (the runner user, uid 1001, equals the image's
`pwuser`).

### 6. Consumer check workflow

`consumers.yml` runs `pnpm run check:consumers` on pull requests, weekly (to notice upstream drift in
React, Vue, Vite and npm) and on demand. It is separate from `ci` because it needs the network and
takes minutes.

### 7. Release

`@changesets/cli` becomes a devDependency, with scripts `changeset` and `release` (`pnpm run build
&& pnpm run check:package && changeset publish`) and Makefile targets `changeset` and
`local-changeset`. `release.yml` is kept: the Changesets action opens or updates the Version Packages
pull request, or publishes with npm Trusted Publishing (`id-token: write`, provenance, no stored
token), then opens the `main` to `develop` back-merge pull request. One initial changeset (minor,
initial public release) is added, and the placeholder text in `CHANGELOG.md` is reset to the header
Changesets expects.

### 8. Tests

`src/conventions.test.ts` checks, with plain text matching (no YAML dependency): every external
`uses:` is a 40-hex SHA followed by a `# vX.Y.Z` comment; every workflow has a top-level
`permissions` and none uses `pull_request_target` or `write-all`; `_deploy.yml` has the guard and
no Pages remnants; deploy workflows call CI and `needs: checks`; Chromium is installed wherever
`pnpm run ci` or `check:consumers` runs; `release.yml` has the publish guard, `id-token: write` and
no npm token. `actionlint` (Docker image) validates syntax and expressions once.

## Owner's one-time setup (not done by Claude)

1. **GitHub repository settings**: set `develop` as the default branch (pull requests target it);
   Settings > Actions > General: allow GitHub Actions to create and approve pull requests (needed by
   the Version Packages, release and back-merge pull requests), or provide the optional
   `RELEASE_TOKEN` secret (GitHub App token or fine-grained PAT with contents and pull-requests
   write) so those pull requests also trigger CI; enable Dependabot version updates.
2. **Environments**: create `development` and `production` (add protection rules to `production`,
   for example a required reviewer).
3. **Cloudflare**: create an API token from the "Edit Cloudflare Workers" template (Account >
   Workers Scripts: Edit; Account Settings: Read; User Details: Read) and note the account id; add
   the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (repository or environment level);
   add the repository variable `CLOUDFLARE_WORKER_NAME` (for example `su3-web-materials`). The first
   deploy of each Worker registers it; the account needs a `workers.dev` subdomain.
4. **npm**: confirm the package name is free, publish `0.0.0` once by hand from a clean checkout of
   `main` (`pnpm run build && pnpm run check:package && npm publish --access public`), then add a
   trusted publisher for `su3-hokkaido/su3-web-materials` naming the workflow file `release.yml`; add
   the repository variable `NPM_PUBLISH_REPOSITORY` with the value `su3-hokkaido/su3-web-materials`.
5. **Branch protection** for `main` and `develop`: require the checks `Checks` (CI), `Visual
regression test` and `Consumer check`, and a pull request before merging.
6. Delete the initial changeset if the first release should not be `0.1.0`.

## Affected files and directories

- New: `deploy/cloudflare/{deploy.ts,deploy-lib.ts,deploy-lib.test.ts}`, `.github/workflows/consumers.yml`,
  an initial `.changeset/*.md`.
- Removed: `deploy/cloudflare/deploy.sh`.
- Modified: `.github/workflows/{ci,_deploy,deploy_dev,deploy_prod,vrt,release}.yml`, `package.json`
  and `pnpm-lock.yaml` (`@changesets/cli`, scripts), `Makefile`, `CHANGELOG.md`, `vitest.config.ts`,
  `src/conventions.test.ts`, `.github/ISSUE_TEMPLATE/bug_report.yml`, `CLAUDE.md`,
  `docs/project_plan.md` (sections 2, 4, 8, 9, 14, 15, 17).
- Design tokens, package `exports`, `custom-elements.json`, story titles, VRT baselines: unchanged.
  README and README_JA: unchanged (Phase 8).

## Provenance

The workflows, the setup action and the release flow are adapted from the owner's
`su3-ui-component-catalog-template`; the deploy script, the consumers workflow and the workflow tests
are new. Nothing is taken from material-web.

## Judgment calls

- A second persistent Worker for `develop` rather than Previews or Version URLs (decision 1).
- No `push` trigger on `ci.yml`: gating through `workflow_call` runs CI once per push and ties the
  deploy to it.
- The deploy script is TypeScript, not shell, so its logic is unit-testable on every platform.
- `check:consumers` is a separate scheduled workflow, not part of `ci`.
