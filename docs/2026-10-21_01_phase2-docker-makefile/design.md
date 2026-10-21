# Phase 2: Docker, compose and Makefile

## Background

`docs/project_plan.md` section 5 (container and local development), section 6 (Makefile) and
section 14 (Phase 2) make Docker the default environment: the project must work without Node.js on
the host, and `make` is the single entry point. Phase 1 left `pnpm run ci` working on the host. This
phase carries the Docker setup over from `su3-ui-component-catalog-template` (Dockerfile,
`compose.yaml`, Makefile, `.dockerignore`, `.env.docker.sample`), trims it to what exists today, and
makes `make ci` run the same checks inside a container.

## Requirements

- `make setup` builds the image and installs dependencies; `make dev` serves Storybook at
  http://localhost:5070; `make ci` passes inside the container.
- Every Phase 1 tool target (`lint`, `format`, `typecheck`, `test`, `test-watch`, `build-storybook`,
  `ci`) is available through `make`, plus `up`, `down`, `logs`, `shell`, `install`, `clean` and
  `help`.
- `local-*` targets run the same pnpm scripts on the host for people who have Node.js.
- Browser tests (Vitest Browser Mode) run inside the container.
- The Dockerfile checks in `src/conventions.test.ts` are active again.

## Non-goals

Preview service and per-product builds (Phase 3), `make build` and `make new-product` (Phase 4), the
VRT service and image (Phase 5), changesets and GitHub Actions (Phase 6). AWS Secrets Manager
targets and `.env.local.sample` are removed for good (plan section 7); nothing in this repository
reads secrets.

## Technical approach and key decisions

### 1. Chromium lives in the dev image (judgment call)

Vitest Browser Mode needs Chromium. The dev image is `node:26-trixie-slim` because `devEngines`
requires Node.js 26, while the official Playwright image ships Node.js 24, so the tests cannot run
there. The `dev` stage therefore:

1. switches to root and installs the Playwright CLI globally at the exact `playwright` version
   written in `package.json`,
2. runs `playwright install --with-deps chromium` with `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`
   (a shared, world-readable location), removes the CLI, and cleans the apt lists,
3. returns to the `node` user.

`PLAYWRIGHT_BROWSERS_PATH` is also set in the image environment, so the `playwright` package used by
Vitest finds the same browser. Compose gives the service `shm_size: 1gb` because Chromium's default
64 MB `/dev/shm` is too small for some pages.

Pixel-exact VRT keeps its own image later (Phase 5): behavior tests do not depend on OS font
rendering, screenshots do.

### 2. Stages and image layout

- `base`: Node.js (`ARG NODE_VERSION=26`) and the pnpm version from the `packageManager` field,
  installed with npm (Node.js 25+ has no Corepack). The pnpm store sits inside `node_modules`, which
  compose mounts as a named volume, so pnpm can hard-link packages and Linux dependencies stay
  separate from any macOS `node_modules`.
- `dev`: Chromium as above, `SBCONFIG_HOSTNAME=0.0.0.0` so the published port is reachable,
  `EXPOSE 5070`, `CMD ["pnpm", "run", "dev", "--ci"]`. The `dev` script runs `analyze` first, so the
  container needs no extra step to generate `custom-elements.json`.
- No `build`, `vrt` or `preview` stage yet; later phases add them as additional stages, keeping
  `preview` last so an untargeted build produces it.

### 3. Compose

One service, `storybook`: target `dev`, `init: true`, port `${DEV_PORT:-5070}:5070` (the container
port is fixed; only the host side is configurable), `PRODUCT_ID` passed through, the repository
bind-mounted at `/app`, the `node_modules` named volume, and `shm_size: 1gb`. Tool commands run as
one-off containers of this service (`docker compose run --rm storybook ...`), which publish no ports,
so they also work while `make up` is running.

### 4. Makefile

The template's machinery is reused: `COMPOSE` forwards `PRODUCT_ID` only when given and adds
`--env-file .env.docker` when that file exists; `RUN` is the one-off container; `help` is generated
from `## ` comments. Targets: `help`, `setup`, `dev`, `up`, `down`, `logs`, `shell`, `install`,
`lint`, `format`, `typecheck`, `test`, `test-watch`, `build-storybook`, `ci`, `clean`, and `local-*`
twins of the tool targets. `setup` copies `.env.*.sample` files without overwriting, builds the image
and runs `pnpm install --frozen-lockfile`. The Makefile must work with the macOS make (3.81) as well
as GNU make 4.

Targets from plan section 6 that do not exist yet (`preview`, `build`, `vrt`, `vrt-update`,
`new-product`, `changeset`) are added by the phase that introduces what they run; the table in
section 6 remains the target list.

### 5. Environment files

`.env.docker.sample` holds `DEV_PORT`, `PREVIEW_PORT` (marked as used from Phase 3) and `PRODUCT_ID`
(default `sample`, which does not exist until Phase 3; Storybook falls back to shared stories only,
see `.storybook/main.ts`). Real `.env*` files stay git-ignored and excluded from the build context.

### 6. Conventions test

`src/conventions.test.ts` already has Dockerfile checks guarded by `runIf(Dockerfile exists)`. They
become active, with two changes: the Playwright-image tag check applies only when a `vrt` stage
exists (Phase 5), and a new check asserts that the Chromium install takes its version from
`devDependencies.playwright` and that `playwright` and `@playwright/test` are pinned to the same
version.

## Affected files and directories

- New: `Dockerfile`, `compose.yaml`, `Makefile`, `.dockerignore`, `.env.docker.sample`.
- Modified: `src/conventions.test.ts`, `docs/project_plan.md` (sections 5, 14, 17), `CLAUDE.md`
  (remove the "until Phase 2" wording).
- Design tokens, package `exports`, `custom-elements.json`, story titles and URLs, VRT baselines:
  unchanged. README and README_JA: unchanged (Phase 8).

## Provenance

The Docker setup is adapted from the owner's own `su3-ui-component-catalog-template` repository, with
the React, Tailwind, tsdown, VRT, preview and secrets parts removed. Nothing is taken from
material-web.

## Risks and notes

- The Docker daemon was not running when this phase was planned; end-to-end verification needs
  Docker Desktop to be started.
- File watching through bind mounts on macOS can be slow or miss events; if hot reload proves
  unreliable, set `CHOKIDAR_USEPOLLING=1` for the service and record it.
- Image size grows by roughly the size of Chromium and its system libraries; acceptable for a local
  development image.
- Files the container creates in the bind mount (`custom-elements.json`, `storybook-static`,
  `coverage`) belong to uid 1000 on Linux hosts; on Docker Desktop for macOS ownership is mapped.
