# Web Component Catalog — Project Plan

> This document is the specification Claude Code follows when implementing this UI catalog
> template repository.
>
> - Every artifact in the repository (code, comments, documentation, per-task docs under `docs/`,
>   commit messages, PR descriptions) is written in **English**. The only exception is
>   `README_JA.md`, which is Japanese.
> - Sections marked **Decision** record changes or additions to the original draft that the owner
>   has approved. Implement them as written.
> - See [Revision history](#17-revision-history) for what changed in each review.

---

## 1. Goal / Purpose

- **Goal**: Build a template for a UI/UX component catalog repository such like https://github.com/material-components/material-web
- **Purpose**: A "template plus working sample" that can be forked and adopted immediately when
  joining a new organization as a contractor or employee.
- **Distribution**:
  - The repository is public and configured as a GitHub Template Repository.
  - The package is published to npm as OSS so that it can be installed even in its template state.
- **License**: MIT (**Decision**: added explicitly because the project is published as OSS).

---

## 2. Tech Stack

| Category               | Tool                                                                                | Notes                                                                                                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosting                | GitHub                                                                              | Template repository, Actions, Releases                                                                                                                                                                                                                   |
| UI                     | React + TypeScript                                                                  | `strict: true`                                                                                                                                                                                                                                           |
| Styling                | Tailwind CSS                                                                        | Latest major (v4, CSS-first configuration). See §10                                                                                                                                                                                                      |
| Package manager        | pnpm                                                                                | Pinned with the `packageManager` field. pnpm itself switches to that version on the host; the Dockerfile installs that exact version with npm, because Node.js 25+ no longer bundles Corepack                                                            |
| Runtime                | Node.js                                                                             | **26** (owner decision; Active LTS from late October 2026), pinned in `.nvmrc` and `devEngines` (see note below)                                                                                                                                         |
| Language               | TypeScript                                                                          | 6.0.x until typescript-eslint and Storybook's docgen support TypeScript 7 (the native port)                                                                                                                                                              |
| Unit test              | Vitest + React Testing Library                                                      | `jsdom` environment, `@testing-library/jest-dom` matchers                                                                                                                                                                                                |
| Lint / Format          | ESLint (flat config) + Prettier                                                     | ESLint 10. `eslint-config-prettier` to avoid conflicts. `eslint-plugin-jsx-a11y` is not used (it supports ESLint 9 at most); accessibility is covered by the a11y addon and role-based tests                                                             |
| Library build          | tsdown (Rolldown based)                                                             | Emits ESM + CJS + `.d.ts`. Replaced tsup, which is no longer maintained (Decision 2)                                                                                                                                                                     |
| Container              | Dockerfile + docker compose                                                         | Local development assumes Docker                                                                                                                                                                                                                         |
| Task runner            | Makefile                                                                            | Single entry point for every command                                                                                                                                                                                                                     |
| Deploy                 | Cloudflare Pages (Workers Static Assets only if Pages cannot meet the requirements) | Structured so that other clouds can be swapped in. See §4                                                                                                                                                                                                |
| Visual regression test | Playwright                                                                          | `toHaveScreenshot` against the built Storybook. See §11                                                                                                                                                                                                  |
| Versioning             | Changesets                                                                          | SemVer (MAJOR.MINOR.PATCH)                                                                                                                                                                                                                               |

## 4. URL Design per productId

Original draft: `http://localhost:5071/{productId}/buttons/toggle`.

### Decisions

Storybook URLs are natively of the form `/?path=/story/buttons-toggle--default`; a path such as
`/{productId}/buttons/toggle` cannot be produced directly. It is implemented as follows.

1. **Build Storybook separately for each productId** into `dist/storybook/{productId}/`. The
   `PRODUCT_ID` environment variable narrows the stories glob in `.storybook/main.ts` to
   `src/shared/**` + `src/products/{productId}/**`.
2. The productId index page from `portal/` is served at `/`.
3. **Clean URLs are provided by redirects that use a fixed `c` segment**:

   ```
   /{productId}/c/{category}/{component}  ->  /{productId}/?path=/story/{category}-{component}--default
   ```

   Why the `c` segment: Cloudflare `_redirects` rules are applied even when a static asset exists
   at the requested path. A rule of the form `/:productId/:category/:component` would also capture
   Storybook's own three-segment asset paths (e.g. `/sample/assets/iframe-abc123.js`) and break the
   catalog. With the fixed segment, a category or component can never collide with a build
   directory, and plain `_redirects` is enough.

   - Cloudflare: `deploy/cloudflare/_redirects`, copied to the root of the deploy output:
     ```
     /:productId/c/:category/:component  /:productId/?path=/story/:category-:component--default  302
     ```
     Cloudflare's documentation confirms that destinations may contain query strings and
     placeholders, and placeholder names are `[A-Za-z]\w*`, so `:category-:component` should
     expand correctly. Phase 3 confirmed this locally with `wrangler pages dev`; verify it with a
     real preview deploy before marking §15 complete.
   - Local (Docker): `deploy/local/nginx.conf` serves the production build with an equivalent rule,
     for example
     `location ~ ^/([^/]+)/c/([^/]+)/([^/]+)/?$ { return 302 /$1/?path=/story/$2-$3--default; }`.

4. `make dev` (Storybook dev server with HMR) targets a single productId and uses the native
   Storybook URLs. Clean URLs are checked with `make preview` (serves the built output).

### URL and story naming rules

- Story `title` is `{Category}/{Component}` (e.g. `Buttons/Toggle`) and never contains the
  productId.
- Every component file exports a story named **`Default`**, because the clean URL always points at
  `--default`. The VRT and the component reviewer check this.
- URL segments are Storybook's sanitized IDs: lower-case, with non-alphanumeric characters turned
  into `-`. A title of `Buttons/IconButton` therefore becomes `/{productId}/c/buttons/iconbutton`.
  README documents this rule with an example.
- A story title must be unique within a build. Because a product build contains `shared` plus that
  product, a product must not reuse a title that exists in `shared`. Storybook fails the build on a
  duplicate ID, so `make build-storybook` in CI catches violations.

### Cloudflare service selection

The owner prefers **Cloudflare Pages**. With the `c` segment, the redirect is a plain
`_redirects` rule, so Pages Functions are not needed. Switch to **Workers Static Assets** only if
Pages cannot meet one of the requirements below; if that happens, record the reason in README and
in the PR. Check the latest official Cloudflare documentation before implementing.

Requirements Pages must meet:

- Per-productId sub-path hosting and the clean-URL redirect above.
- Two environments: `main` -> production and `develop` -> preview (branch alias URL via
  `wrangler pages deploy --branch develop`).
- An optional custom domain.
- Deploys from GitHub Actions via wrangler.

### Domain

- Any domain can be configured. When none is configured, `*.pages.dev` (or `*.workers.dev` for
  Workers) is used.
- Pages custom domains are configured in the dashboard or via the API rather than in wrangler
  configuration, so README documents the steps. (On Workers, set `routes` in `wrangler.jsonc` from
  the `CF_CUSTOM_DOMAIN` environment variable.)

---

## 5. Container / Local Development

- Docker is the default; the project must work without Node.js installed on the host.
- The `Dockerfile` is multi-stage:
  - `base`: Node.js (pinned major) + the pnpm version from `packageManager`, installed with npm.
  - `dev`: runs the Storybook dev server, listening on `0.0.0.0` (`SBCONFIG_HOSTNAME`).
  - `build`: builds Storybook and the package.
  - `preview`: unprivileged nginx (port 8080) serving `dist/storybook`, including the URL rewrite
    (`deploy/local/nginx.conf`).
- `compose.yaml`:
  - `storybook` service (dev): host `5070` -> container `5070` (Storybook runs with `-p 5070`; HMR
    uses the same server, so only the host side of the mapping changes). Source is bind-mounted;
    `node_modules` is a named volume that also holds the pnpm store. Tool targets (`make lint`,
    `make ci`, ...) run in one-off containers of this service.
  - `preview` service (behind a profile): host `5071` -> nginx `8080`.
  - `vrt` service (behind a profile): the official Playwright image, see §11. It mounts only the
    Playwright config, `tests/vrt` and `dist/storybook`, so the image's own `node_modules` is used.
  - Ports are configurable via `DEV_PORT=5070` / `PREVIEW_PORT=5071` in `.env.docker`.
- For people who have Node.js on the host, `make` also provides non-Docker targets (`local-*`).

---

## 6. Makefile

`make help` lists every target with its description. The product is always selected with the
`PRODUCT_ID` variable. Minimum targets:

| Target                                         | Description                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `make help`                                    | List targets                                                       |
| `make setup`                                   | Copy `.env.*.sample`, build images, install dependencies           |
| `make up` / `make down`                        | Start / stop docker compose                                        |
| `make dev PRODUCT_ID=sample`                   | Storybook dev server (http://localhost:5070); defaults to `sample` |
| `make preview`                                 | Build every productId and serve with nginx (http://localhost:5071) |
| `make vrt`                                     | Run the Playwright visual regression test (in Docker)              |
| `make vrt-update`                              | Update baseline images                                             |
| `make install PKG=xxx`                         | `pnpm add` inside the container                                    |
| `make lint` / `make format` / `make typecheck` | Static analysis and formatting                                     |
| `make test` / `make test-watch`                | Vitest                                                             |
| `make build`                                   | Package build (tsdown + CSS)                                       |
| `make build-storybook`                         | Storybook build for every productId                                |
| `make ci`                                      | Run the same checks as CI locally                                  |
| `make new-product PRODUCT_ID=xxx`              | Scaffold a productId                                               |
| `make secrets-pull-aws`                        | Generate `.env.local` from AWS Secrets Manager                     |
| `make secrets-push-cloudflare`                 | (Optional) Push secrets to Cloudflare. Changes remote state        |
| `make changeset`                               | Create a changeset                                                 |
| `make shell`                                   | Open a shell in the container                                      |

---

## 7. Environment Variables / Secrets

- Only `.env.local.sample` and `.env.docker.sample` are distributed. Real files such as `.env`,
  `.env.local` and `.env.docker` are excluded by `.gitignore` (which must explicitly re-include
  `!.env.*.sample`).
- Each sample file documents every variable with an English comment.

### Decision: copying secrets out of Cloudflare is not possible

- Cloudflare Worker and Pages secrets are **write-only**; their values cannot be read back via the
  API or wrangler.
- `cloudflared access login` authenticates against applications protected by Cloudflare Access and
  cannot be used to fetch secrets.

Therefore:

- **AWS Secrets Manager is the source of truth for secrets.**
  - `make secrets-pull-aws`: `aws sso login --profile $AWS_PROFILE` ->
    `aws secretsmanager get-secret-value` -> generate `.env.local`.
  - Optional `make secrets-push-cloudflare`: push the Secrets Manager values to Cloudflare with
    `wrangler pages secret put` / `bulk` (or `wrangler secret put` on Workers). One direction only.
- **CI/CD credentials** (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) live in GitHub Actions
  Secrets / Environments.
- A static Storybook deployment needs almost no runtime secrets. The template provides the
  mechanism only, and README explains where to swap in another store (1Password, Doppler, etc.).

Implementation (Phase 7; details in `docs/2026-10-20_01_phase7-secrets/design.md`):

- The secret's `SecretString` is a flat JSON object of variables (the console's key/value
  format). The AWS CLI v2 runs on the host (owner decision); the conversion runs in the dev
  container (`scripts/secrets-to-env.ts`), so the host needs no Node.js. `local-*` variants use
  the host's Node.js.
- Settings (not secrets) `AWS_PROFILE`, `AWS_REGION`, `AWS_SECRET_ID` and
  `CLOUDFLARE_PROJECT_NAME` live in `.env.docker` (owner decision); the environment or the make
  command line overrides them.
- `.env.local` is written atomically with mode 600, values quoted so that Vite's `loadEnv` reads
  them back exactly (values it cannot represent are rejected). A file that does not start with
  the managed marker line is not replaced without `FORCE=1`; `.env.local.sample` starts with it.
- The push requires `PAGES_ENV=production|preview` and a confirmation (`YES=1` skips it), reads
  the secret from AWS rather than `.env.local`, and pipes it to `wrangler pages secret bulk`.
- `STORYBOOK_*` variables are embedded in the built Storybook, so they must not hold real
  secrets.

---

## 8. GitHub Actions

### Branch strategy

- `main`: production. Merges deploy to production.
- `develop`: integration. Merges deploy to the preview environment.
- Feature branches (`feature/*`) are cut from `develop` and merged into `develop` via PR;
  `develop` is merged into `main` via a release PR.
- After every release, `main` is merged back into `develop` so that the version bump and changelog
  committed by Changesets do not diverge. `release.yml` opens this back-merge PR automatically
  after a publish (or README documents the manual step if automation is not feasible).

### Workflows

| File                | Trigger                                               | Jobs                                                                                                                                                          |
| ------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`            | `pull_request`, and `push` to `main` / `develop` only | `prettier --check`, `eslint`, `tsc --noEmit`, `vitest run` (coverage), Storybook build, package build                                                         |
| `deploy_dev.yml`    | push to `develop`                                     | Build every Storybook -> deploy to the Cloudflare preview environment                                                                                         |
| `deploy_prod.yml`   | push to `main`                                        | Build every Storybook -> deploy to Cloudflare production                                                                                                      |
| `vrt.yml`           | `pull_request`                                        | Build every Storybook -> Playwright VRT. Upload the diff report as an artifact on failure                                                                     |
| `create-d2m-pr.yml` | push to `develop`                                     | git-pr-release: open/update the `develop` -> `main` release PR listing the merged PRs (`.git-pr-release`, `.github/git-pr-release.erb`)                       |
| `release.yml`       | push to `main`                                        | Changesets action: open/update the "Version Packages" PR, or on its merge tag / GitHub Release / npm publish, then open the `main` -> `develop` back-merge PR |

- Deploy logic is confined to `deploy/cloudflare/` scripts and the reusable `_deploy.yml`, so
  switching to AWS/Azure touches as few files as possible.
- Use GitHub Environments (`development`, `production`) so that production can carry protection
  rules.
- Cache the pnpm store (not in the release job).
- (Optional) Post the per-PR preview deploy URL as a PR comment. Not implemented: pull requests
  from forks have no secrets, and the `develop` preview covers review.
- Implementation notes (Phase 6; details and the owner's one-time setup in
  `docs/2026-10-19_02_phase6-github-actions/design.md`):
  - Every job uses `.github/actions/setup` (pnpm from `packageManager`, Node.js from `.nvmrc`,
    `pnpm install --frozen-lockfile`). `ci.yml` runs `pnpm run ci`, the script behind `make ci`.
  - `vrt.yml` builds Storybook on the runner and runs the compose `vrt` service exactly as
    `make vrt` does; the runner user (uid 1001) matches the image's `pwuser`.
  - The Pages project's production branch is `main`; `deploy/cloudflare/deploy.sh` runs
    `wrangler pages deploy dist/storybook --branch <branch>`, so `develop` deploys to
    `develop.<project>.pages.dev`. There is no `wrangler.jsonc`: Pages direct upload takes flags.
  - Actions are pinned to commit SHAs (owner decision) and updated by Dependabot against
    `develop`.
  - Pull requests opened with `GITHUB_TOKEN` do not trigger workflows; an optional `RELEASE_TOKEN`
    secret is used for the release, Version Packages and back-merge pull requests when set.

### Guards for template copies and forks

Repositories created with "Use this template" and forks inherit the workflows but not the secrets.

- Deploy jobs run only when the required configuration exists, e.g.
  `if: vars.CLOUDFLARE_PROJECT_NAME != ''`, and otherwise skip with a notice instead of failing.
  `CLOUDFLARE_PROJECT_NAME` must be a repository variable, because a job's `if` is evaluated
  before its environment applies.
- The npm publish step runs only when `github.repository` matches the repository that owns the
  package name (configured as a repository variable), so a fork that has not renamed the package
  can never attempt to publish it. Implemented as the repository variable
  `NPM_PUBLISH_REPOSITORY`; outside that repository `release.yml` still maintains the Version
  Packages PR but passes no publish script.

---

## 9. Package Publishing

- Package name: **`su3-web-materials`** (unscoped).
  - Forks are expected to rename it to their organization (e.g. `@acme/ui`). README lists every
    place that must change (`package.json`, README, import examples, workflows, repository
    variables, Tailwind prefix).
  - Confirm on npm that the name is unused before the first publish.
- `package.json` `exports` provides sub-paths:
  - `su3-web-materials` -> shared
  - `su3-web-materials/{productId}` -> each product
  - `su3-web-materials/styles.css` -> prebuilt CSS (§10)
  - `su3-web-materials/theme.css` -> design tokens for consumers that run Tailwind
    (§10)
- Product entries are wired automatically:
  - `tsdown.config.ts` derives its entries from the directories in `src/products` (one
    `dist/products/{productId}` entry each).
  - `scripts/new-product.ts` (`make new-product`) creates the product and writes the
    `./{productId}` entry to `exports`.
  - `make ci` runs a check that every `src/products/*` directory has a matching `exports` entry,
    so a manually added product cannot be left unexported.
- `react` and `react-dom` are `peerDependencies`. `tailwindcss` is an optional peer, because
  consumers using the prebuilt CSS do not need it.
- `sideEffects: ["**/*.css"]` so that JavaScript is tree-shakable while CSS imports are kept.
- Registries:
  - The template itself: **npmjs (public)**, using npm Trusted Publishing (GitHub Actions OIDC) with
    provenance, so no long-lived npm token is stored.
    - Verified in Phase 6 (npm documentation, 2026-10): a trusted publisher can only be configured
      for a package that already exists, so the **first publish is a one-time manual step by the
      owner** (0.0.0 from a clean checkout of `main`), after which the trusted publisher names
      `release.yml`. `changeset publish` runs `pnpm publish`, which exchanges the GitHub OIDC
      token and attaches provenance itself. README documents the step (Phase 8).
  - Forks for internal use: README documents how to switch `publishConfig.registry` to
    **GitHub Packages (private)**.
- Versioning: SemVer, managed by Changesets; tags are `v1.2.3`. `.changeset/config.json` uses
  `baseBranch: develop` (feature PRs target it) and `access: public`; `make changeset` adds a
  changeset, and `pnpm run release` builds, checks and publishes the package.

---

## 10. Styling (Tailwind CSS)

### Setup

- Tailwind CSS v4 with CSS-first configuration: `@theme` tokens in `src/styles/theme.css`, imported
  by the Tailwind entries `src/styles/index.css` (Storybook) and `src/styles/package.css`
  (`styles.css`). Do not create `tailwind.config.js`.
- Storybook loads Tailwind through the `@tailwindcss/vite` plugin, and `.storybook/preview.ts`
  imports `src/styles/index.css`.
- Design tokens (color, spacing, radius, font, etc.) are CSS variables in `@theme`; every component
  uses tokens. Avoid arbitrary values such as `bg-[#123456]`.
- Dark mode uses a `.dark` class, declared with
  `@custom-variant dark (&:where(.dark, .dark *));`, and is switchable from the Storybook toolbar.

### Class collision prevention

- To avoid collisions with the consumer's Tailwind or existing CSS, use the **prefix `uic`**
  (`uic:bg-primary`).
  - `uic` = "UI catalog". `ui` is shorter but too generic and likely to collide with other UI
    libraries or consumer naming.
  - With a prefix, Tailwind also prefixes the generated CSS variables (`--uic-color-primary`), so
    tokens do not collide with the consumer's theme either. Tokens are still declared unprefixed
    inside `@theme`.
  - Forks are encouraged to change it to an organization abbreviation (e.g. `acme`); README
    explains how.
  - The prefix is changed from a single constant shared by the stylesheets in `src/styles` (the
    `prefix(...)` imports and the `--uic-*` dark overrides; `src/styles/prefix.test.ts` checks
    them), the `tailwind-merge` configuration (`extendTailwindMerge({ prefix })`) and the consumer snippet in
    README.
  - Check the allowed characters for a Tailwind v4 prefix in the official documentation.

### Preflight

**Decision**: preflight (Tailwind's reset) is not included in the distributed CSS, so the library
never resets the consumer's page.

- Because Tailwind utilities assume preflight in places (for example, preflight sets
  `border: 0 solid`, so `border` alone draws nothing without it), components must not depend on
  preflight: set what they need explicitly (e.g. `uic:border uic:border-solid`).
- Storybook loads the same preflight-free styles as the distributed CSS, so that stories and the VRT
  show what consumers actually get.

### Variants / class merging

- `cn()` = `clsx` + `tailwind-merge` in `src/lib/cn.ts`. Every component accepts a `className` prop
  merged through `cn()`.
- Variants are defined with `class-variance-authority` (cva) and exposed type-safely.

### Distribution (two consumer patterns)

1. **Prebuilt CSS (projects without Tailwind)**
   - Generate `dist/styles.css` with the Tailwind CLI from `src/styles/package.css`, which scans
     only the built JavaScript (no stories or tests), and expose it as
     `import "su3-web-materials/styles.css"`.
2. **Built by the consumer's Tailwind (projects that already use Tailwind)**
   - Distribute `dist/theme.css` (the `@theme` tokens).
   - A Tailwind prefix applies per compile, so the consumer's own Tailwind build (with no prefix or
     a different one) will not generate the library's `uic:` classes. The consumer therefore adds a
     **separate CSS entry** for the library that imports Tailwind's theme and utilities with the
     same prefix, for example:
     ```css
     /* ui-catalog.css (separate from the consumer's own Tailwind entry) */
     @layer theme, utilities;
     @import 'tailwindcss/theme.css' layer(theme) prefix(uic);
     @import 'tailwindcss/utilities.css' layer(utilities) prefix(uic) source(none);
     @import 'su3-web-materials/theme.css';
     @source '../node_modules/su3-web-materials/dist';
     ```
   - Tailwind's documentation also shows importing `theme.css` / `utilities.css` twice in one file,
     with and without a prefix. **The Phase 4 proof of concept (Vite 8 and Next.js 16 with
     Tailwind 4.3) confirmed the separate entry above and ruled out the single file**: in one
     compile the library's `--color-*: initial` also removes the consumer's palette (e.g.
     `bg-red-500` is no longer generated). Details:
     `docs/2026-10-18_03_phase4-package-build/design.md`.

- The JavaScript entries start with `'use client'`, so Next.js App Router server components can
  import the components directly.

- README_JA / README document both patterns with code examples.

---

## 11. Visual Regression Test (Playwright)

- Use Playwright's `toHaveScreenshot` against the **built Storybook** (the same output as
  `make preview`).
- Stories are enumerated automatically from Storybook's `index.json`, so adding a story never
  requires writing a test. Each story is opened at `iframe.html?id=<storyId>&viewMode=story`.
- Story `parameters` allow per-story exclusion and configuration (e.g. `vrt: { disable: true }`,
  `vrt: { viewports: [...] }`). The viewport names are `desktop` and `mobile`; unknown keys or
  values fail the test.
- Stories under `src/shared` are in every product's build; they are captured once, from the first
  product. Baselines live in `tests/vrt/__screenshots__/{viewport}/{shared|productId}/` and are
  named `{storyId}-{theme}.png`. A baseline with no matching story fails the run.
- Capture conditions are fixed:
  - Chromium only (initial scope). Two viewports: desktop (`Desktop Chrome`, 1280x720) and mobile
    (`Pixel 7`).
  - Animations disabled; wait for fonts to finish loading.
  - Both light and dark themes.
- **To avoid font and OS rendering differences, both local runs and CI run inside the official
  Playwright Docker image** (`make vrt` runs in the container). Additionally:
  - The image tag matches the `@playwright/test` version in `package.json` exactly; bump them
    together (checked by `src/conventions.test.ts`). The image installs only `@playwright/test`,
    because its Node.js (24) is not the project's; `make vrt` builds Storybook in the dev image
    first.
  - The `vrt` service is pinned to `platform: linux/amd64`, because Apple Silicon (arm64) hosts can
    render differently from amd64 CI runners.
  - Baseline images are committed to git.
- Baselines are updated with `make vrt-update`. README describes the review process: PRs that update
  baselines must have their diff images reviewed.

---

## 12. Documentation

### README.md (English)

Starts with a link to `[日本語はこちら](./README_JA.md)`. Sections:

1. One-liner description
2. Tech stack
3. Quick start (`make setup` -> `make dev`)
4. Project structure / the productId concept / URL and story naming rules
5. **Using this template** (after Fork / "Use this template")
   - Renaming the package and scope
   - Changing the Tailwind prefix
   - Adding a productId (`make new-product`)
   - Cloudflare setup (GitHub Secrets / variables, custom domain)
   - Choosing a secrets store
   - Switching the deploy target to AWS / Azure
6. Installing the published package (consumer examples for both CSS patterns)
7. Release flow (Changesets, back-merge to `develop`)
8. Make commands
9. License

### README_JA.md (Japanese)

- **Same headings in the same order** as README.md, so that the two are easy to diff. The
  `readme-sync` Claude Code agent checks this.
- Starts with a link to `[English](./README.md)`.

### Other

- `CLAUDE.md`: coding conventions, directory conventions, the component checklist (component /
  story / test / export), and running `make ci` before handing work back.
- `CONTRIBUTING.md` (optional). Not added (Phase 8): README's release flow, the PR template and
  `CLAUDE.md` cover contribution.

---

## 13. Coding Conventions (mirrored in CLAUDE.md)

- All code, comments (including comments explaining the reasoning behind an implementation) and
  documentation are in English. Only `README_JA.md` is Japanese.
- One component per directory: `components/{category}/{Component}/` containing `Component.tsx`,
  `Component.stories.tsx`, `Component.test.tsx` and `index.ts`.
- Story `title` is `{Category}/{Component}`, never includes the productId, and every story file
  exports a `Default` story (§4).
- Accessibility: no violations in the Storybook a11y addon.
- Styling uses Tailwind utility classes only (with the `uic` prefix); no per-component CSS files
  (§10). Components do not rely on preflight.
- Classes are always merged with `cn()`, and variants are defined with cva.
- Colors, spacing and similar values always come from tokens; no hardcoded values.
- Respect the dependency direction in §3.

---

## 14. Implementation Phases

1. Foundation: pnpm / TS / ESLint / Prettier / Vitest / Storybook / Tailwind CSS / sample
   components
2. Docker / compose / Makefile
3. Per-productId builds, portal, URL rewrite (nginx and Cloudflare `_redirects`)
4. Package build (tsdown + CSS output), exports, `make new-product`, and the consumer-side Tailwind
   PoC (§10)
5. Playwright VRT (Docker, baseline creation)
6. GitHub Actions (CI -> VRT -> deploy -> release, with the template/fork guards)
7. Secrets scripts
8. README / README_JA / CLAUDE.md

`make ci` must pass at the end of every phase.

## 15. Acceptance Criteria

- [ ] On a clean machine, `make setup && make dev` alone opens Storybook at http://localhost:5070
- [ ] `make preview` shows the matching story at `http://localhost:5071/sample/c/buttons/toggle`,
      and Storybook's own assets under `/sample/` load without being redirected
- [ ] `make vrt` gives the same result locally (Docker) and in CI, and new stories are included
      automatically
- [ ] On Cloudflare Pages (or Workers, with the reason documented), `/{productId}/c/{category}/{component}`
      works
- [ ] `make ci` succeeds, and CI runs the same checks
- [ ] Pushes to `develop` / `main` deploy to Cloudflare automatically
- [ ] Merging a PR with a changeset results in a tag, a Release, an npm publish and a back-merge
      PR to `develop`
- [ ] In a repository created from the template (no secrets configured), CI passes and deploy /
      publish jobs are skipped instead of failing
- [ ] Another project can `pnpm add su3-web-materials` and import components
- [ ] In a project without Tailwind, importing `styles.css` alone applies the styles
- [ ] In a project with Tailwind, the documented `theme.css` + `@source` setup applies the styles
      without colliding with the consumer's classes
- [ ] README covers every place that must be changed after forking

---

## 16. Decisions Summary

- Package name: `su3-web-materials`
- Styling: Tailwind CSS v4, prefix `uic`, no preflight in distributed CSS (§10)
- Deploy: Cloudflare Pages first; Workers Static Assets only if Pages cannot meet the requirements
  (§4)
- Clean URLs: `/{productId}/c/{category}/{component}` via `_redirects` (§4)
- Local ports: dev = `5070`, preview = `5071`
- Visual regression test: Playwright in Docker, `linux/amd64` (§11)
- Language: everything in the repository is English except `README_JA.md`
- Every **Decision** in this document is approved

When a judgment call not covered here is needed during implementation, follow common best practice
and explain the reasoning in the PR description.
