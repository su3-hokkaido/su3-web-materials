# Web Component Catalog — Project Plan

> This document is the specification Claude Code follows when implementing this repository.
>
> - Every artifact in the repository (code, comments, documentation, per-task docs under `docs/`,
>   commit messages, PR descriptions) is written in **English**. The only exception is
>   `README_JA.md`, which is Japanese.
> - Sections marked **Decision** record choices the owner has approved. Implement them as written.
> - Items marked **Open** are not decided yet; resolve them in the phase named next to them and
>   record the outcome in §17.
> - See [Revision history](#17-revision-history) for what changed in each review.

---

## 1. Goal / Purpose

- **Goal**: Publish a rich catalog site and an npm package of **real Web Components** (custom
  elements built with Lit), inspired by the structure of
  [material-web](https://github.com/material-components/material-web).
- **Purpose**: A working, public sample that the owner can point to, and copy from, when joining a
  team (as a contractor or an employee) that has no UI component catalog.
- **Non-goals**: no monetization; no paid services. Everything runs on free tiers.
- **Distribution**: the repository is public; the package is published to npm; the catalog is
  hosted on Cloudflare (§4).

### Positioning

material-web is in **maintenance mode** (its `docs/roadmap.md`): no new components are planned, and
Card, Badge, Navigation bar / drawer / rail, Segmented button, Snackbar, Tooltip, Top app bar,
pickers and Data table were never built. This project is a maintained, independently designed
catalog and may grow into those components after the MVP (§14, Phase 9).

### License and provenance (Decision)

- This project is licensed **MIT**.
- **material-web is used as a reference for structure and ideas only. No source code, Sass, token
  files, documentation text, images or icons are copied from it.** Everything is written from
  scratch. That keeps the repository clear of Apache-2.0 per-file notice and NOTICE obligations.
- Naming is independent: custom element tags use the prefix **`su3-`** (e.g. `<su3-button>`), CSS
  custom properties use **`--su3-*`**. Neither "Material", "Material Design", `md-` nor Google
  branding is used for names, logos or marketing copy. The visual design is original (a documented
  design language in `docs/design/`, created in Phase 1), not a re-skin of Material.
- Fonts and icons must be redistributable: self-host subsets under their own licenses (OFL /
  Apache-2.0) and list them with their licenses in `THIRD_PARTY_NOTICES.md`. Prefer system fonts
  and inline SVG icons to keep the package small.
- If code is ever copied from another project, stop and ask the owner first.

---

## 2. Tech Stack

| Category               | Tool                                                        | Notes                                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosting (source)       | GitHub                                                      | Public repository, Actions, Releases                                                                                                                        |
| Components             | Lit 3 + TypeScript                                          | `strict: true`. Shadow DOM, `ElementInternals` for form association. **Decision**: no framework other than Lit in the runtime                               |
| Styling                | Plain CSS in `css` tagged templates + CSS custom properties | Three token layers (§10). No Tailwind, no Sass, no preflight concerns: Shadow DOM isolates styles                                                           |
| Catalog                | Storybook (`@storybook/web-components-vite`)                | **Decision**: Storybook is kept as the catalog engine. Docs are generated from `custom-elements.json`                                                       |
| Package manager        | pnpm                                                        | Pinned with the `packageManager` field. The Dockerfile installs that exact version with npm (Node.js 25+ no longer bundles Corepack)                        |
| Runtime                | Node.js                                                     | **26** (owner decision; Active LTS from late October 2026), pinned in `.nvmrc` and `devEngines`                                                             |
| Language               | TypeScript                                                  | 6.0.x until typescript-eslint and Storybook's tooling support TypeScript 7                                                                                  |
| Unit / behavior test   | Vitest **Browser Mode** (Playwright provider)               | Real Chromium, so Shadow DOM, focus, `ElementInternals` and forms behave as in production. jsdom is not used. See §11                                       |
| Lint / Format          | ESLint (flat config) + Prettier                             | `eslint-plugin-lit` and `eslint-plugin-wc` are added if they support the ESLint major in use; otherwise rely on tests and the a11y addon                    |
| Library build          | tsdown (Rolldown based)                                     | ESM only and **unbundled** (`dist` mirrors `src`), `.d.ts`, `custom-elements.json`; standalone CSS comes from a post-build script (§9, resolved in Phase 4) |
| Container              | Dockerfile + docker compose                                 | Local development assumes Docker (§5)                                                                                                                       |
| Task runner            | Makefile                                                    | Single entry point for every command                                                                                                                        |
| Deploy                 | **Cloudflare Workers Static Assets**                        | **Decision (revised)**: see §4                                                                                                                              |
| Visual regression test | Playwright `toHaveScreenshot`                               | Against the built Storybook, in Docker. See §11                                                                                                             |
| Versioning             | Changesets                                                  | SemVer (MAJOR.MINOR.PATCH)                                                                                                                                  |

**Decision (Phase 1)**: no decorators. Components use `static properties`, `declare`d fields whose
defaults are assigned in the constructor, and a guarded `customElements.define`. The Phase 1 spike
verified tsc, Vitest Browser Mode, Storybook docs and the custom elements manifest analyzer, and
that importing the module in Node does not throw. See §17.

---

## 3. Project Structure

```
src/
  shared/
    tokens/                 # --su3-ref-*, --su3-sys-* CSS (exported as styles and as plain CSS)
    behaviors/              # base classes: form-associated, form-submitter, ...
    components/{category}/{name}/
      {name}.ts             # element class, no side effects
      {name}.styles.ts      # css`...` using --su3-comp-{name}-* tokens
      {name}.stories.ts
      {name}.test.ts
      index.ts              # component entry: defineElement(...) registration + re-export
    index.ts                # re-exports classes and types of every shared component (registers nothing)
  products/{productId}/
    theme.css               # token overrides that define this product's look
    components/{category}/{name}/...   # product-only components (same layout)
    index.ts
  conventions.test.ts
portal/                     # productId index page served at /
deploy/cloudflare/          # _redirects, wrangler.jsonc, deploy script
deploy/local/nginx.conf
tests/vrt/
docs/
```

- `{category}` is lower-case kebab-case: `foundation`, `buttons`, `selection`, `inputs`,
  `containment`, ...
- Dependency direction: products may import `shared`; `shared` never imports products; products
  never import each other.
- **Side effects (Decision)**: the class module `{name}.ts` has no side effects. The component's
  `index.ts` registers the element through the guarded `defineElement` helper
  (`src/shared/define-element.ts`) and re-exports the class. The package root only re-exports
  classes and types from the `{name}.ts` modules, and consumers import
  `su3-web-materials/button.js` (the component entry, registers `<su3-button>`) or a catch-all
  `su3-web-materials/all.js`. `sideEffects` in `package.json` lists the registering entries.
- Behavior shared by many elements (form association, ARIA delegation) lives in
  `src/shared/behaviors/` as base classes (`FormAssociatedElement`, `FormSubmitterElement`,
  `FormCheckableElement`). **Visual helpers (Decision, Phase 7)**: the state layer, focus ring and
  touch target are CSS fragments in `src/shared/styles/` (built from tokens), not elements: they must
  act on a component's own box (`::before`, `outline`, `::after`), and the design language uses state
  layers, so there is no ripple. There is no `foundation` component category for now.

---

## 4. URL Design per productId and Hosting

### productId (Decision)

A productId is a **themed demo**: the same shared components rendered with a different set of token
overrides (and optionally product-only components). It doubles as the worked example of "one
catalog per company" for reuse in a new team. The initial products are `sample` (the default look)
and one contrasting product (e.g. `acme`) that demonstrates re-theming through tokens only.

### URLs

Storybook URLs are natively of the form `/?path=/story/buttons-button--default`. Clean URLs are
provided by redirects with a fixed `c` segment:

```
/{productId}/c/{category}/{component}  ->  /{productId}/?path=/story/{category}-{component}--default
```

1. **Build Storybook separately for each productId** into `dist/storybook/{productId}/`. The
   `PRODUCT_ID` environment variable narrows the stories glob to `src/shared/**` +
   `src/products/{productId}/**`, and loads that product's `theme.css`.
2. The portal (`portal/`) is served at `/`.
3. Why the `c` segment: `_redirects` rules apply even when a static asset exists at the path. A
   rule such as `/:productId/:category/:component` would capture Storybook's own three-segment
   asset paths and break the catalog.
4. `deploy/cloudflare/_redirects` is copied to the root of the deploy output:
   ```
   /:productId/c/:category/:component  /:productId/?path=/story/:category-:component--default  302
   ```
   The placeholder expansion (`:category-:component`) was **verified in Phase 3** with
   `wrangler dev` (the Workers runtime), including a hyphenated category, the variant with a
   trailing slash and a real browser walk-through; the real preview deploy is still to be checked
   in Phase 6 before §15 is marked complete. Cloudflare's `html_handling: auto-trailing-slash`
   redirects `/sample/iframe.html` to `/sample/iframe` (query string preserved); nginx serves the
   file directly. Both end up at the same page.
5. Local (Docker): `deploy/local/nginx.conf` serves the production build with an equivalent rule.
6. `make dev` (Storybook dev server with HMR) targets a single productId and uses native
   Storybook URLs. Clean URLs are checked with `make preview`.

### URL and story naming rules

- Story `title` is `{Category}/{Component}` (e.g. `Buttons/Button`) and never contains the
  productId. Every story file exports a **`Default`** story (the clean URL points at `--default`).
- URL segments are Storybook's sanitized IDs: lower-case, non-alphanumeric characters become `-`.
- A story title must be unique within a build; a product must not reuse a `shared` title. Storybook
  fails the build on a duplicate ID.

### Cloudflare service selection (Decision, revised)

Cloudflare's current documentation says new projects should use **Workers Static Assets**; Pages
keeps working but receives no new features, and a Pages migration guide exists. Static asset
requests are free and unlimited on the Free plan. `_redirects` and `_headers` are supported by
Workers Static Assets, so the clean-URL design is unchanged.

- Use **Workers Static Assets** (`deploy/cloudflare/wrangler.jsonc` with `assets.directory`; no
  Worker script, no `main`, no `binding`). `compatibility_date` is the day the file was written and
  must not be newer than the pinned `wrangler`'s workerd supports (`wrangler@4.151.1` rejected
  2026-10-21, `4.151.3` accepts it).
- Free plan limits that matter (re-check before each phase that changes output size): **20,000
  files per Worker version**, **25 MiB per file**, 2,000 static + 100 dynamic redirects. **Measured in
  Phase 3**: two products plus the portal are 96 files and 16.2 MiB (largest file 3.2 MiB), with 2
  dynamic redirect rules, so the limits are not a practical concern. `scripts/build-storybook-all.ts`
  still checks them on every build (warning above 75% of the file limit, failure above any limit).
- Environments (**Decision, Phase 6**): `main` -> the production Worker `${CLOUDFLARE_WORKER_NAME}`;
  `develop` -> a second, **persistent** preview Worker `${CLOUDFLARE_WORKER_NAME}-dev`, both through
  `wrangler deploy --name` with `deploy/cloudflare/wrangler.jsonc`. Cloudflare's current guidance:
  Previews (`wrangler preview`) are branch/pull-request environments under one Worker; Wrangler
  environments (separately named Workers) fit development and staging; Version URLs and
  `--preview-alias` only inspect one uploaded version and are not isolated. A stable URL that follows
  `develop` is a persistent Worker; it is free (100 Workers on the Free plan) and needs nothing but
  static assets. Per-pull-request previews can be added later with `wrangler preview`.
- Deploys: GitHub Actions + `deploy/cloudflare/deploy.ts` (`wrangler deploy`), gated so that CI must
  pass first (§8). Workers Builds
  (Cloudflare's own Git integration) is the fallback if the API token handling becomes a burden.
- Domain: `*.workers.dev` by default; a custom domain is optional and documented in README.

---

## 5. Container / Local Development

- Docker is the default; the project must work without Node.js installed on the host.
- Multi-stage `Dockerfile`: `base` (Node.js + pnpm), `dev` (Storybook dev server on `0.0.0.0`),
  `build` (Storybook and package), `preview` (unprivileged nginx on 8080 with the URL rewrite).
- `compose.yaml`: `storybook` service on host `5070`; `preview` service (profile) on `5071`; `vrt`
  service (profile) using the official Playwright image (§11). Ports are configurable through
  `DEV_PORT` / `PREVIEW_PORT` in `.env.docker`.
- **Decision (Phase 2)**: Vitest Browser Mode needs Chromium, which lives in the **dev image**
  (`node:26-trixie-slim`), not in the Playwright image: `devEngines.runtime` requires Node.js 26
  while the Playwright image ships a different major. The `dev` stage installs the Playwright CLI at
  the exact `playwright` version from `package.json`, runs `playwright install --with-deps chromium`
  into `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`, and removes the CLI again; compose sets
  `shm_size: 1gb`. `make test` and `make ci` therefore run the browser tests in the container. The
  pixel-exact VRT keeps its own Playwright image (Phase 5), because behavior tests do not depend on
  OS font rendering. `src/conventions.test.ts` keeps the `playwright` and `@playwright/test` pins
  equal and the Dockerfile reading the version from `package.json`.
- `local-*` targets exist for people who have Node.js on the host.

---

## 6. Makefile

`make help` lists every target. The product is selected with `PRODUCT_ID` (default `sample`).
The table is the target set for the finished project; each phase adds the targets for what it
introduces (Phase 2: everything Docker-related and the checks, plus `analyze`; `preview`,
`build-storybook` for every product, `build`, `new-product`, `vrt`, `vrt-update` and `changeset`
follow in Phases 3 to 6). The Makefile must work with GNU make 3.81, the macOS default.

| Target                                         | Description                                                |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `make help`                                    | List targets                                               |
| `make setup`                                   | Copy `.env.*.sample`, build images, install dependencies   |
| `make up` / `make down`                        | Start / stop docker compose                                |
| `make dev PRODUCT_ID=sample`                   | Storybook dev server (http://localhost:5070)               |
| `make preview`                                 | Build every productId and serve with nginx (port 5071)     |
| `make test` / `make test-watch`                | Vitest Browser Mode                                        |
| `make vrt` / `make vrt-update`                 | Run / update the Playwright visual regression test         |
| `make install PKG=xxx`                         | `pnpm add` inside the container                            |
| `make lint` / `make format` / `make typecheck` | Static analysis and formatting                             |
| `make build`                                   | Package build (components, tokens, `custom-elements.json`) |
| `make build-storybook`                         | Storybook build for every productId                        |
| `make ci`                                      | Run the same checks as CI locally                          |
| `make new-product PRODUCT_ID=xxx`              | Scaffold a productId                                       |
| `make changeset`                               | Create a changeset                                         |
| `make shell`                                   | Open a shell in the container                              |

---

## 7. Environment Variables / Secrets (Decision, simplified)

- A static catalog needs no runtime secrets. Only `.env.docker.sample` (ports, product default) is
  distributed; real `.env*` files are git-ignored (`!.env.*.sample` re-included).
- **AWS Secrets Manager, `make secrets-pull-aws` and `make secrets-push-cloudflare` are removed**
  (they carried recurring cost and no benefit here). Phase 7 of the previous plan is dropped.
- CI/CD credentials (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) live in GitHub Actions
  Secrets / Environments. Cloudflare Worker secrets are write-only, so nothing is ever read back.
- `STORYBOOK_*` variables are embedded in the built Storybook and must never hold real secrets.

---

## 8. GitHub Actions

### Branch strategy

- `main`: production. `develop`: integration, deploys the preview. `feature/*` are cut from
  `develop` and merged by PR; `develop` is merged into `main` via a release PR.
- After every release, `main` is merged back into `develop` so that the Changesets version bump and
  changelog do not diverge (automated in `release.yml`, otherwise documented).

### Workflows

| File                | Trigger                                        | Jobs                                                                                  |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `ci.yml`            | `pull_request` and `workflow_call` (no `push`) | analyze, prettier, eslint, tsc, Vitest (Chromium), package build and check, Storybook |
| `vrt.yml`           | `pull_request`, `workflow_dispatch`            | Build every Storybook -> Playwright VRT; upload the diff report on failure            |
| `consumers.yml`     | `pull_request`, weekly, `workflow_dispatch`    | Install the packed tarball into the plain HTML, Vite, React 19 and Vue fixtures       |
| `deploy_dev.yml`    | push to `develop`                              | `ci.yml`, then build every Storybook -> deploy the preview Worker (`-dev`)            |
| `deploy_prod.yml`   | push to `main`                                 | `ci.yml`, then build every Storybook -> deploy the production Worker                  |
| `create-d2m-pr.yml` | push to `develop`                              | Open/update the `develop` -> `main` release PR                                        |
| `release.yml`       | push to `main`                                 | Changesets: Version Packages PR, or tag / GitHub Release / npm publish + back-merge   |

- Deploy logic is confined to `deploy/cloudflare/` (`deploy.ts`, pure `deploy-lib.ts` with unit
  tests and an end-to-end test against a stubbed `pnpm`) and the reusable `_deploy.yml`.
- **CI gating (Decision, Phase 6)**: `ci.yml` has no `push` trigger; the deploy workflows call it as
  their `checks` job and deploy with `needs: checks`, so a push to `develop` or `main` runs CI exactly
  once and a failing CI blocks the deploy. Forks run CI on push and skip only the deploy job. Vitest
  Browser Mode needs Chromium, so the CI and consumer jobs run `playwright install --with-deps
chromium`.
- Use GitHub Environments (`development`, `production`); cache the pnpm store (not in release).
- Pin every action to a full commit SHA with a `# vX.Y.Z` comment; Dependabot updates them against
  `develop`. Keep `permissions` minimal.
- Deploy jobs run only when `vars.CLOUDFLARE_WORKER_NAME` is set (renamed from the Pages-era
  `CLOUDFLARE_PROJECT_NAME`); the npm publish step runs only when `github.repository` equals
  `vars.NPM_PUBLISH_REPOSITORY`. These guards keep forks green. (Lower priority than in the previous
  plan: this repository is a showcase, not a template.)
- Pull requests opened with `GITHUB_TOKEN` do not trigger workflows; an optional `RELEASE_TOKEN`
  secret is used for the release, Version Packages and back-merge PRs when set.

### Owner's one-time setup

Claude never runs remote or deploy commands, so these steps are the owner's (the same list is in
`docs/2026-10-21_05_phase6-github-actions/design.md`; the README repeats it in Phase 8):

1. **GitHub**: make `develop` the default branch; Settings > Actions > General: allow GitHub Actions
   to create and approve pull requests (or set the optional `RELEASE_TOKEN` secret); enable
   Dependabot version updates.
2. **Environments**: create `development` and `production` (protect `production`).
3. **Cloudflare**: an API token from the "Edit Cloudflare Workers" template and the account id as the
   secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; the repository variable
   `CLOUDFLARE_WORKER_NAME` (for example `su3-web-materials`); a `workers.dev` subdomain.
4. **npm**: confirm the name is free, publish `0.0.0` once by hand from a clean checkout of `main`,
   add a trusted publisher naming `release.yml`, and set the repository variable
   `NPM_PUBLISH_REPOSITORY` to `su3-hokkaido/su3-web-materials`.
5. **Branch protection** for `main` and `develop`: require `Checks`, `Visual regression test` and
   `Consumer check`, and a pull request before merging.

---

## 9. Package Publishing

- Package name: **`su3-web-materials`** (unscoped). Confirm on npm that the name is unused before
  the first publish.
- `package.json` `exports` (ESM only; each JavaScript entry is `{ types, default }`), **derived from
  the directory layout by `scripts/lib/package-exports.ts`** and rewritten by
  `pnpm run sync:exports` (`make sync-exports`); a convention test fails when it is stale:
  - `.` -> classes and types only (no registration side effects)
  - `./all.js` -> registers every shared component
  - `./{name}.js` -> one entry per component, registering its element (e.g. `./button.js`)
  - `./{productId}` -> each product's components
  - `./tokens.css` -> `--su3-ref-*` / `--su3-sys-*` defaults for `:root` (plain CSS)
  - `./themes/{productId}.css` -> each product's token overrides
  - `./custom-elements.json` -> manifest (also referenced by the `customElements` field)
- Components inject their own styles in Shadow DOM, so **no global stylesheet is required**
  except `tokens.css` (defaults). Components also fall back to built-in default values, so a
  consumer who skips `tokens.css` still gets a usable, unthemed result. Load `tokens.css` first,
  then a product theme (`themes/{productId}.css`): equal-specificity rules win by source order.
- `lit` is a `dependency` (Lit's own guidance for component packages), with a permissive range
  (`^3`) so consumers can dedupe. **Decision (Phase 4)**: components are published as standard
  **ES2022** JavaScript (the code uses private `#fields`, which every evergreen browser supports;
  ES2021 would only add helper code).
- **Build (Phase 4)**: `pnpm run build` = `analyze`, `tsdown`, `scripts/build-package-assets.ts`.
  tsdown runs unbundled (`unbundle: true`, glob entries, ESM, `.js` and `.d.ts`), so
  `dist/shared/components/buttons/button/button.js` mirrors its source, which keeps the side-effect
  boundary (class modules are pure; each component's `index.js` registers) and lets the manifest map
  `src/*.ts` to `dist/*.js` one to one. Standalone CSS is not bundled: `dist/tokens.css` is
  `buildTokensCss()` and `dist/themes/{id}.css` is each product's `theme.css`.
  `dist/custom-elements.json` is the analyzer output with module paths rewritten into `dist`.
  Pitfall found and fixed: the `sideEffects` field of `package.json` also applied to the _source_
  modules during the build and silently emptied `all.js`; the build therefore sets
  `treeshake.moduleSideEffects` to always true.
- Package fields: `files` (`dist`, not `dist/storybook`), `sideEffects` (the registering entries and
  CSS), `types`, `customElements`, `publishConfig.access`; no `private` and no `engines`.
- Checks: `pnpm run check:package` (`scripts/check-package.ts`: exports targets, no `.ts` specifiers,
  pure class modules and registering entries, `tokens.css`, themes, manifest tags and paths, packed
  file list, then `publint --strict` and `attw --profile esm-only`) is part of `make ci`;
  `pnpm run check:consumers` (`make check-consumers`) installs the packed tarball into the plain
  HTML, Vite, React 19 and Vue fixtures under `tests/consumers` and tests them in Chromium. It needs
  network access and Chromium, so it is not part of `ci`; Phase 6 runs it as its own CI job.
- `make new-product PRODUCT_ID=...` creates `src/products/{id}/index.ts` and `theme.css` and syncs
  `exports`; name clashes with a component or a reserved id are rejected before anything is written.
- Registries: **npmjs (public)** via npm Trusted Publishing (GitHub Actions OIDC, provenance), so no
  long-lived npm token is stored. A trusted publisher can only be configured for a package that
  exists, so the **first publish (0.0.0 from a clean checkout of `main`) is a one-time manual step
  by the owner**; README documents it.
- Versioning: SemVer via Changesets, tags `v1.2.3`, `baseBranch: develop`, `access: public`.
- **Framework wrappers (React, Vue) are out of scope for the MVP.** Documentation shows how to use
  the elements from React 19+ (custom elements are supported natively), plain HTML, and Vue. Revisit
  after Phase 9.

---

## 10. Styling and Tokens

### Rules

- Components style themselves with `css` tagged templates in `{name}.styles.ts`, scoped by Shadow
  DOM. No Tailwind, no Sass, no global selectors, no `!important`.
- Never hardcode a color, size, radius, duration or font in a component: use a token (below).
- Respect `prefers-reduced-motion`, `prefers-color-scheme` (through tokens, see Dark mode) and
  `forced-colors` (use system colors for borders and focus rings in forced-colors mode).
- Expose styling hooks deliberately: CSS custom properties (tokens), `::part()` names, and slots.
  Document every part and slot (JSDoc `@csspart`, `@slot`, `@cssprop`) so they reach the manifest.

### Three token layers (Decision; structure inspired by common design-token practice)

| Layer     | Prefix                | Purpose                                         | Example                             |
| --------- | --------------------- | ----------------------------------------------- | ----------------------------------- |
| Reference | `--su3-ref-*`         | Raw values: palette, typeface, scale            | `--su3-ref-palette-blue-500`        |
| System    | `--su3-sys-*`         | Roles and decisions: color roles, shape, motion | `--su3-sys-color-primary`           |
| Component | `--su3-comp-{name}-*` | Per-component knobs, default to a system token  | `--su3-comp-button-container-shape` |

- A component reads only `--su3-comp-*`, whose defaults are declared inside the component as
  `var(--su3-comp-button-container-color, var(--su3-sys-color-primary, <built-in fallback>))`.
- Consumers retheme globally by overriding `--su3-sys-*` on `:root` or on any ancestor, and retune a
  single component with `--su3-comp-*`. A product's `theme.css` is exactly such an override set.
- Token names and values are documented by a generated token table in Storybook.

### Dark mode

Driven by `[data-theme="dark"]` (and `prefers-color-scheme` when no attribute is set) on any
ancestor, implemented by redefining `--su3-sys-color-*`. Switchable from the Storybook toolbar.

### Accessibility

- Native semantics first (`ElementInternals` ARIA, `delegatesFocus`, real `<button>` / `<input>`
  inside the shadow root where appropriate). Forms: form-associated custom elements with
  validation, `name`/`value`, reset and restore.
- No violations in the Storybook a11y addon; keyboard, focus and ARIA covered by tests.

---

## 11. Testing

### Unit / behavior (Vitest Browser Mode)

- Vitest runs in real Chromium through the Playwright provider (`@vitest/browser-playwright`).
  Tests query by role/label and use `expect.element`, and reach into the shadow root only for
  parts that have no accessible handle.
- Each component test covers: rendering of each variant, attribute/property reflection, keyboard
  and pointer interaction, disabled / soft-disabled states, form participation (where applicable),
  events, and the documented CSS parts and slots.
- Vitest runs two projects: `browser` (component and token tests, real Chromium) and `conventions`
  (`src/conventions.test.ts`, Node), which mechanically checks the rules in §3, §10 and §13: component
  layout and naming, `@tagname`/summary/description JSDoc, registration only in the component's
  `index.ts`, token-only styles (no color literals, no `!important`, only `--su3-*` variables),
  story titles and `Default` stories, scope re-exports, `su3-` tags, the absence of material-web
  names, and the Node.js pin.
- Coverage thresholds (v8): 95% statements, lines and functions, 90% branches; raise them as the
  suite grows.

### Visual regression (Playwright)

- `toHaveScreenshot` against the **built Storybook** (the output of `make preview`). Stories are
  enumerated from Storybook's `index.json`; each is opened at
  `iframe.html?id=<storyId>&viewMode=story`.
- Per-story settings:
  `parameters.vrt = { disable?: boolean; viewports?: ('desktop'|'mobile')[]; themed?: boolean }`;
  unknown keys or values fail the run.
- **Which stories (decision, Phase 5; refines the earlier "captured once, from the first
  product")**: the shared stories (`src/shared`) are in every product's build and differ only by
  the theme. They are captured from the **default product `sample`** under `shared/`; any other
  product captures only the shared stories that set `parameters.vrt.themed: true` (stories that
  show a theme's effect, such as the Button `Variants` story), under `{productId}/`; product-only
  stories are always captured under their product. Baselines:
  `tests/vrt/__screenshots__/{viewport}/{shared|productId}/{storyId}-{theme}.png`. A baseline with
  no matching story fails the run; a missing `sample` build is an error.
- Fixed conditions: Chromium; desktop (`Desktop Chrome` 1280x720) and mobile (`Pixel 7`); animations
  disabled; light and dark themes. A story is captured only when Storybook has finished rendering,
  the fonts are ready, every `su3-*` element's `updateComplete` has resolved, and **every `su3-*`
  tag used is defined** (an undefined element would be baselined as plain text).
- **Strict comparison**: `threshold: 0.01`, `maxDiffPixels: 0`. Playwright's default threshold
  (0.2) accepted `#00798e` for `#006071`, so a theme regression went unnoticed; baselines and runs
  come from the same image and are deterministic (two runs, and a regenerated baseline, are
  byte-identical). A plain run never writes baselines (`updateSnapshots: 'none'`);
  `make vrt-update` does.
- `tests/vrt/media.spec.ts` checks what Vitest Browser Mode cannot emulate, with Playwright's media
  emulation on the same build: `prefers-reduced-motion` (transitions off), `forced-colors`
  (system-color borders, focus ring, hover and disabled colors) and `pointer: coarse` (true on the
  touch `mobile` project; the hit area is 44px there and absent with a mouse).
- Runs inside the official Playwright Docker image whose tag equals the `@playwright/test` version
  (checked by `src/conventions.test.ts`), pinned to `linux/amd64`. Baselines are committed.
- `make vrt-update` refreshes baselines; PRs that change them must have the diff images reviewed.
  Baselines of removed/renamed stories and of stories excluded with `parameters.vrt` are deleted by
  hand (the orphan check cannot see those).

---

## 12. Documentation

### README.md (English)

Starts with a link to `[日本語はこちら](./README_JA.md)`. Sections:

1. One-liner description and live catalog link
2. Tech stack
3. Quick start (`make setup` -> `make dev`)
4. Project structure / productId concept / URL and story naming rules
5. Using the package (plain HTML, Vite, React 19+, Vue), tokens and theming
6. Reusing this repository for another team (what to rename, how to add a productId, Cloudflare
   setup, switching the deploy target)
7. Release flow (Changesets, back-merge to `develop`; the manual first publish)
8. Make commands
9. License and third-party notices

### README_JA.md (Japanese)

Same headings in the same order; starts with `[English](./README.md)`. The `readme-sync` agent
checks structural identity.

### Catalog content

- Each component has a Storybook docs page generated from `custom-elements.json` plus hand-written
  MDX for usage guidance, accessibility notes, and token tables.
- Foundation pages (**Phase 8**: MDX files in `src/shared/docs/`, included by the Storybook
  `stories` glob, titled `Foundation/...`, listed first by `storySort`): Getting started, Theming (tokens, dark mode, productId example), Accessibility
  principles, Browser support, Design language (`docs/design/`).

### Other

- `CLAUDE.md`: updated in Phase 1 to match this plan (it still describes the previous React and
  Tailwind stack until then).
- `CONTRIBUTING.md` is not added; README, the PR template and `CLAUDE.md` cover contribution.

---

## 13. Coding Conventions (mirrored in CLAUDE.md after Phase 1)

- All code, comments (including reasoning) and documentation are in English; no emojis.
- One component per directory: `{name}.ts`, `{name}.styles.ts`, `{name}.stories.ts`,
  `{name}.test.ts`, `index.ts`.
- Element tag `su3-{name}`, class `Su3{Name}`, token prefix `--su3-comp-{name}-*`. Declare
  `HTMLElementTagNameMap`.
- Public API documented with JSDoc (`@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires`).
- Story `title` is `{Category}/{Component}` with a `Default` story (§4); a11y addon clean.
- Styling per §10: tokens only, no hardcoded values, no global CSS from a component.
- Do not import across the dependency direction in §3. Components never touch `document` globals at
  import time beyond registering themselves (server-side import must not throw).

---

## 14. Implementation Phases

`make ci` must pass at the end of every phase. The previous plan's phases 1-8 are re-ordered; most
infrastructure is carried over from `su3-ui-component-catalog-template` and adapted.

0. **Plan and cleanup** (this document; update `CLAUDE.md`, agents and skills for Lit/CSS-token
   conventions once the plan is approved).
1. **Foundation spike** (done, §17): pnpm / TS / ESLint / Prettier / Storybook (web-components-vite) /
   Vitest Browser Mode; token files; design language doc; resolve the decorator question; build
   `su3-button` (all variants) end to end with story, test and docs.
2. **Docker / compose / Makefile** (done, §17): carried over and trimmed; no AWS targets.
3. **Per-productId builds, portal, URL rewrite** (done, §17): nginx and Cloudflare `_redirects`,
   `sample` and `acme`; file count measured against the 20,000-file limit.
4. **Package build** (done, §17): unbundled tsdown output, derived `exports`, `tokens.css`, themes,
   `custom-elements.json`, `make new-product`, and consumer proofs of concept (plain HTML, Vite,
   React 19, Vue).
5. **Playwright VRT** (done, §17): Docker image, baselines, strict comparison, media-feature spec.
6. **GitHub Actions** (done, §17): CI -> VRT -> consumers -> deploy to Workers -> release, with the
   fork guards.
7. **MVP components** (done, §17): shared style fragments (state layer, focus ring, touch target),
   IconButton, Checkbox, Switch, TextField, Divider.
8. **README / README_JA / CLAUDE.md / catalog pages** (done, §17); the first manual npm publish is
   the owner's step, documented in the README.
9. **After the MVP** (one task each, in priority order): Card (done, §17), Badge (done, §17), Segmented button, Navigation
   bar / drawer, Snackbar, Tooltip, Top app bar, Select, Dialog, Menu, then pickers and Data table.

## 15. Acceptance Criteria

- [x] On a clean machine, `make setup && make dev` alone opens Storybook at http://localhost:5070
      (Phase 2)
- [x] `make preview` shows the matching story at `http://localhost:5071/sample/c/buttons/button`,
      and Storybook's own assets under `/sample/` load without being redirected (Phase 3)
- [ ] `make test` runs the component tests in a real browser, locally and in CI, with the same result
- [ ] `make vrt` gives the same result locally (Docker) and in CI, and new stories are included
      automatically
- [ ] On Cloudflare Workers Static Assets, `/{productId}/c/{category}/{component}` works, and the
      build stays under the Free plan limits (verified with `wrangler dev` and the limit check in
      Phase 3; the real preview deploy remains, Phase 6)
- [ ] `make ci` succeeds, and CI runs the same checks
- [ ] Pushes to `develop` / `main` deploy automatically; the whole pipeline costs nothing
      (workflows, deploy script and gating are in place and tested statically in Phase 6; the first
      real run needs the owner's setup)
- [ ] Merging a PR with a changeset results in a tag, a Release, an npm publish and a back-merge PR
      (the release workflow, script and an initial changeset are in place; needs the owner's setup)
- [ ] A fork with no secrets passes CI and skips deploy / publish instead of failing (guards and
      their tests are in place; to be observed on a real fork)
- [x] `import 'su3-web-materials/button.js'` registers `<su3-button>` in a plain HTML page, a Vite
      app, a React 19 app and a Vue app, with working styles (`make check-consumers`, Phase 4)
- [x] Re-theming by overriding `--su3-sys-*` works, and the contrasting product demonstrates it
      (`acme`, Phase 3)
- [x] `custom-elements.json` is published and the Storybook docs are generated from it (the
      manifest is in the package; the npm publish itself is Phase 8)
- [x] No source, token or documentation text from material-web is present; `THIRD_PARTY_NOTICES.md`
      lists every bundled font/icon and its license

---

## 16. Decisions Summary

- Package name: `su3-web-materials`; license MIT; independent implementation (§1)
- Components: Lit 3 Web Components, Shadow DOM, tag prefix `su3-`, tokens `--su3-*` (§3, §10)
- Catalog: Storybook (`web-components-vite`), docs from `custom-elements.json` (§2, §12)
- productId: themed demos, built separately (§4)
- Hosting: Cloudflare **Workers Static Assets**, free tier only; clean URLs via `_redirects` (§4)
- Tests: Vitest Browser Mode; VRT with Playwright in Docker `linux/amd64` (§11)
- Secrets: no AWS Secrets Manager; CI credentials only in GitHub (§7)
- MVP scope: foundation parts plus Button, IconButton, Checkbox, Switch, TextField, Divider (§14)
- Local ports: dev = `5070`, preview = `5071`
- Language: everything in the repository is English except `README_JA.md`

When a judgment call not covered here is needed during implementation, follow common best practice
and explain the reasoning in the PR description.

---

## 17. Revision History

- **Initial draft**: React + Tailwind UI catalog template (carried over from
  `su3-ui-component-catalog-template`).
- **Review 2026-10-20 (this revision)**: the repository's goal was changed to a showcase of real
  Web Components inspired by material-web.
  - Replaced React, Tailwind (`uic:` prefix, cva, `cn()`), Vitest + RTL (jsdom) with Lit, CSS custom
    property tokens in Shadow DOM, and Vitest Browser Mode (§2, §10, §11).
  - Kept Storybook, now with `@storybook/web-components-vite` (§2).
  - Switched hosting from Cloudflare Pages to Workers Static Assets, following Cloudflare's current
    guidance for new projects; added the Free plan file-count check (§4).
  - Removed AWS Secrets Manager and the secrets scripts (cost, no benefit); dropped old Phase 7 (§7).
  - Added the license and provenance policy: clean-room implementation, `su3-` naming, no Material
    branding (§1).
  - Restored the missing §3 (project structure), made productId a themed-demo concept, defined the
    MVP scope and the post-MVP roadmap (§3, §4, §14).
  - Opened items: decorators (Phase 1, resolved), tsdown unbundled output and CSS handling (Phase 4,
    resolved), preview environment mechanism (Phase 6).
- **Phase 1 spike (2026-10-20)**: decorators resolved as **none**.
  - Why: Lit recommends experimental decorators only "for now", and standard decorators need the
    `accessor` keyword plus compiler and bundler support that varies between tools. Decorator-free
    code is plain ES2023, needs no publish-time transform and works with `erasableSyntaxOnly`.
  - Verified: `tsc --noEmit` (strict); `cem analyze` reads types, defaults, descriptions, slots,
    parts and events from `static properties`, `declare` fields and JSDoc; Vitest Browser Mode
    queries inside the shadow root by role; the Storybook docs page renders the manifest tables;
    `import` of the module in Node succeeds (Lit's DOM shim).
  - Costs to keep in mind: property names appear twice (in `static properties` and as `declare`
    fields), so the component test must cover each reflected attribute; private `#methods` show up
    in the manifest unless filtered.
  - `rs-module-lexer`'s install script is not needed by the analyzer and stays disabled.
- **Phase 1 completed (2026-10-20)**: the vertical slice works end to end; `pnpm run ci` passes
  (127 browser and convention tests, 98.6% statements, Storybook build, no a11y violations in 9
  stories and two themes). Details: `docs/2026-10-20_01_phase1-foundation/`.
  - Delivered: tooling; the Snowfield design language (`docs/design/design-language.md`); `ref` and
    `sys` tokens with a generated `tokens.css` (light, dark, reduced motion) and contrast tests;
    `FormAssociatedElement` and `FormSubmitterElement` base classes; `<su3-button>` (five variants,
    three sizes, link mode, soft-disabled, form submit and reset); Storybook with manifest-driven
    docs and a theme toolbar; two Vitest projects (`browser`, `conventions`).
  - Decisions: one `<su3-button>` with a `variant` property rather than five elements; base classes
    instead of mixins (§3); the class module is side-effect free and the component `index.ts`
    registers it through `defineElement`, so `@tagname` is required in the JSDoc; the state layer
    (label color over the container) is used for hover and press on every variant, so overriding
    `--su3-comp-button-container-color` keeps the feedback; typeface, border width and focus-ring
    sizes are system tokens, and a convention test forbids color, size and duration literals in
    component styles.
  - Review (`component-reviewer`) findings fixed: lost hover feedback on overridden container color,
    direct use of a reference token, hard-coded sizes, unknown `type` not treated as `submit`,
    manifest noise from static members, `dev` and `build-storybook` needing `custom-elements.json`.
  - Known limits, documented in JSDoc: no `event.submitter` or `formaction`, not the form's default
    button for Enter, `aria-labelledby` and `<label for>` on the host are not forwarded, and a
    capture-phase `stopPropagation()` on an ancestor also stops the submit.
  - Follow-ups carried to later phases: tests for `prefers-reduced-motion`, `forced-colors` and
    `pointer: coarse` (needs media emulation, Phase 5 with the VRT); `--su3-comp-button-*` hooks for
    the disabled colors; Space-key activation for link-mode buttons (decided against: links behave
    as links); validity and reset/restore callbacks in `FormAssociatedElement` (Phase 7, with the
    first real form control); `package.json` `exports` and publishing (Phase 4).
  - `README_sample_from_another_repo.md` in the repository root is a leftover from the template
    repository and should be moved out of the root or deleted by the owner.
- **Phase 2 completed (2026-10-21)**: Docker is the working environment. Details:
  `docs/2026-10-21_01_phase2-docker-makefile/`.
  - Delivered: `Dockerfile` (`base`, `dev` with Chromium), `compose.yaml` (`storybook` service),
    `Makefile` (Docker and `local-*` targets, `help`), `.dockerignore`, `.env.docker.sample`, and the
    Dockerfile checks in `src/conventions.test.ts`.
  - Verified in Docker: a fresh `make setup`; `make ci` (130 tests including the Chromium browser
    tests, Storybook build); `make up` serving Storybook on 5070 with file changes picked up through
    the bind mount (no polling needed); `make down` and `make clean` leaving no containers, volumes
    or images; `make local-ci` on the host; `make help` on GNU make 3.81.
  - Decisions: Chromium in the dev image (§5); `.storybook/main.ts` treats the default product
    `sample` as optional until Phase 3, because compose always passes `PRODUCT_ID`; the `analyze`
    target was added; `.env.local.sample` and the AWS and Cloudflare secrets targets are gone for good
    (§7).
  - Notes: the dev image is about 2 GB because of Chromium; Storybook prints "Change detection
    unavailable: git is not available" in the container (harmless; `.git` is not in the image);
    pnpm's store setting makes npm print an unknown-config warning during the image build
    (harmless).
- **Phase 3 completed (2026-10-21)**: per-product builds, the portal and the clean URLs work in
  Docker, in nginx and in the Workers runtime. Details: `docs/2026-10-21_02_phase3-product-builds/`.
  - Delivered: products `sample` (the default look) and `acme` (violet accent, pill buttons, rounded
    font) with a `theme.css` each; the `@product-theme` alias in Storybook; `scripts/build-storybook-all.ts`
    with `scripts/lib` (product ids, clean URLs, portal, hosting limits, a theme CSS reader);
    `portal/index.html`; `deploy/cloudflare/_redirects` and `wrangler.jsonc`; `deploy/local/nginx.conf`;
    Dockerfile `build` and `preview` stages, the compose `preview` service, `make preview`;
    `make build-storybook` now builds every product.
  - Verified: a real browser follows `/{productId}/c/buttons/button` to the Storybook UI and the
    preview iframe shows the product's accent (`#006071` and `#693996`), through `make preview` (nginx)
    and `wrangler dev` (Workers runtime); `/sample` redirects to `/sample/`; assets and `iframe.html`
    are not redirected; `/_redirects` is 404 in both; edge cases (unknown product, wrong depth) behave
    the same; `make dev PRODUCT_ID=acme` serves the acme theme; an unknown `PRODUCT_ID` fails the
    build; `make ci` and `make local-ci` pass (197 tests).
  - Decisions: a product theme overrides only `--su3-sys-*` and `--su3-comp-*` tokens in plain
    `#rrggbb` colors and must meet the contrast thresholds, which `src/conventions.test.ts`
    enforces for every product; the default token stylesheet is prepended so a product theme wins by
    source order (consumers load `tokens.css` first, then the theme); a product without stories adds
    no story pattern; wrangler is pinned to 4.151.3 (see §4); `make new-product` stays in Phase 4
    because it writes the package `exports`.
  - Notes: the Workers runtime adds a redirect hop for `iframe.html` (§4); `wrangler dev` needs no
    login for assets-only sites; `.dockerignore` keeps the build context free of env files.
- **Phase 4 completed (2026-10-21)**: the repository builds into a publishable package and is
  proven from the consumer side. Details: `docs/2026-10-21_03_phase4-package-build/`.
  - Resolved the two open items: **unbundled output** works with tsdown (`unbundle: true`; import
    specifiers become `.js` in JavaScript and declarations, JSDoc is kept) and **CSS handling** is a
    post-build script (`tokens.css` and `themes/*.css`), because component styles live in JavaScript.
  - Delivered: `tsdown.config.ts`; `src/shared/all.ts`; derived `exports`, `files`, `sideEffects`,
    `types`, `customElements`, `publishConfig` (no `private`); `scripts/build-package-assets.ts`;
    `scripts/lib/{package-exports,manifest-paths}.ts`; `scripts/check-package.ts`;
    `scripts/new-product.ts`; `scripts/sync-package-exports.ts`; `scripts/check-consumers.ts` with
    four fixtures; Makefile targets `build`, `check-package`, `sync-exports`, `new-product`,
    `check-consumers` and `local-*` twins. The package is 39 files, 103.7 KiB unpacked.
  - Verified: `pnpm run ci` and `make ci` (216 tests, build, publint, attw `esm-only`); all four
    consumer fixtures on the host and in Docker (element defined, accent `rgb(0, 96, 113)` by
    default, `rgb(105, 57, 150)` with `themes/acme.css`, a click works, React 19 and Vite type-check
    with `skipLibCheck: false`, plain HTML works with an import map and with no `tokens.css`);
    mutation checks for every package check; a `make new-product` round trip.
  - Decisions: ES2022 target (§9); `private` removed, publishing stays the owner's manual step;
    the analyzer's `packagejson` option is off because it rewrote the `customElements` field;
    `check:consumers` stays out of `ci` (network and Chromium) and becomes a CI job in Phase 6;
    the published manifest is a rewritten copy of the source one.
  - Notes: attw reports `CJSResolvesToESM` for the ESM-only package; it is ignored by the
    `esm-only` profile on purpose (CommonJS consumers use a dynamic import). Consumers of React need
    their own JSX typing for the custom element (shown in `tests/consumers/react`); a documented
    snippet belongs in the README (Phase 8).
- **Phase 5 completed (2026-10-21)**: the visual regression test and the media-feature checks work in
  the `linux/amd64` Playwright image. Details: `docs/2026-10-21_04_phase5-vrt/`.
  - Delivered: `playwright.config.ts`; the Dockerfile `vrt` stage (tag equal to `@playwright/test`),
    the compose `vrt` service and `make vrt` / `make vrt-update`; `tests/vrt/{stories,site}.ts`,
    `stories.spec.ts`, `media.spec.ts` and the unit tests of the helpers; 40 baselines (20 per
    viewport: 18 `shared`, 2 `acme`); convention checks for the config, the compose service, the
    Makefile targets, `parameters.vrt` in every story and the baseline layout.
  - Feasibility: Chromium 156 runs under amd64 emulation on this Apple Silicon machine (about 1.3
    seconds to start and capture; a full `make vrt` is about 1.3 minutes), so no CI-only fallback is
    needed. Two runs and a regenerated baseline are byte-identical.
  - **Bugs the VRT found**: (1) the built Storybook never defined `<su3-button>`: Vite applied the
    package's `sideEffects` field to this project's own `src` modules and dropped each story's
    `import './index.ts'`; fixed with a Vite plugin in `.storybook/main.ts` that keeps side effects
    for `src` (a build option cannot, Vite sets the flag per module), and the VRT now fails on an
    undefined `su3-*` tag; (2) an icon-only button was not centered (an empty label item still got a
    `gap`); fixed with a `hasLabel` state (the label wrapper is hidden, the control is `icon-only` and
    square) and tests. The same `sideEffects` pitfall had already hit tsdown in Phase 4.
  - Verified by mutation: a changed token color fails 14 tests with 14 diff images (after the
    threshold fix; before it, the change passed); a renamed story fails the orphan check; a missing
    baseline fails `make vrt` without being written and is recreated byte-identically by
    `make vrt-update`; breaking the coarse-pointer or reduced-motion CSS fails `media.spec.ts`;
    removing the forced-colors CSS fails the disabled-state test (Chromium adapts borders, focus ring
    and hover on its own, so those tests pin the behavior).
  - Decisions: `themed` instead of capturing every shared story per product; VRT stays out of `ci`
    (emulation cost) and gets its own workflow in Phase 6; media checks live in Playwright because
    `pointer: coarse` needs a touch device context.
  - Notes: a transient Docker Hub timeout failed one `make vrt --build` (retry); a baseline review
    means viewing the images, not trusting the green run (the first baselines showed unstyled text and
    exposed bug 1).
- **Phase 6 completed (2026-10-21)**: the workflows are adapted and tested; everything that needs a
  remote account is the owner's one-time setup (§8). Details:
  `docs/2026-10-21_05_phase6-github-actions/`.
  - Resolved the last open item: `develop` deploys a **second persistent Worker** (`-dev`), `main` the
    production Worker, both through `wrangler deploy --name` (§4).
  - Delivered: `deploy/cloudflare/{deploy.ts,deploy-lib.ts}` with unit tests and an end-to-end test
    against a stubbed `pnpm` (no network); `_deploy.yml` for Workers with the
    `CLOUDFLARE_WORKER_NAME` guard; `ci.yml` as `pull_request` plus `workflow_call`, installing
    Chromium; `deploy_dev.yml` and `deploy_prod.yml` calling it and `needs: checks`; `consumers.yml`
    (pull request, weekly, manual); `vrt.yml` touch-ups; `@changesets/cli`, the `changeset` and
    `release` scripts, an initial minor changeset and a reset `CHANGELOG.md`; Makefile `changeset`
    targets; deny rules for `deploy.ts` and `pnpm run release` in `.claude/settings.json`.
  - Verified: 150 convention tests including the workflow checks (every external action pinned to a
    SHA with a version comment, minimal permissions, timeouts, guards, CI gating, Chromium before
    `pnpm run ci`, Trusted Publishing without an npm token, Cloudflare credentials only in the deploy
    workflows) and 11 injected mistakes that each fail the right check; `actionlint` (Docker) is clean
    and does report errors in a deliberately broken workflow; `make ci` passes. Not run, by policy:
    any deploy, publish, push or pull request.
  - Decisions: no `push` trigger on `ci.yml` (gating through `workflow_call`); the deploy script is
    TypeScript so it is testable; the consumer check is its own workflow, not part of `ci`.
  - Notes: the placeholder text in `CHANGELOG.md` ("Early Bird / hogehoge", version 0.1.0) was reset
    because Changesets owns the file and the initial changeset produces 0.1.0; delete
    `.changeset/initial-release.md` if the first release should differ. Required status check names
    for branch protection are `Checks` (CI), `Visual regression test` and `Consumer check`; when CI
    runs as the deploy workflows' `checks` job it is reported as `CI / Checks`.

- **Phase 7 completed (2026-10-21)**: the MVP components are in. Details:
  `docs/2026-10-21_06_phase7-mvp-components/`.
  - Delivered: `src/shared/styles/{state-layer,focus-ring,touch-target}.ts` (the Button was refactored
    onto them); `FormAssociatedElement` gained the validity API, `setValidityState`, reset and restore
    hooks, `delegatesFocus` and `accessibleName`; the new `FormCheckableElement`; `su3-checkbox`,
    `su3-switch`, `su3-text-field`, `su3-icon-button` and `su3-divider`; sys sizes `checkbox`,
    `switch-track-*`, `switch-thumb`; two extra contrast pairs on `surface-sunken`.
  - Verified: the 40 pre-existing VRT baselines are byte-identical after the Button refactor; new
    baselines reviewed by viewing the images (light and dark, desktop and mobile); axe reports 0
    violations in 38 stories x 2 themes; `check:package` and `check:consumers` pass with the new
    entries; mutation checks on the form base class.
  - Decisions: foundation parts are style fragments, not elements (no ripple, no `foundation`
    category); labels sit above the text field (no floating label); the checkbox and switch wrap a
    native hidden input for accessibility and keyboard handling, and `change` is re-dispatched on the
    host; the `checked` attribute is the initial state and reset restores it; everything ships in the
    initial changeset.
- **Phase 8 completed (2026-10-21)**: documentation. Details:
  `docs/2026-10-21_07_phase8-readme-catalog-pages/`.
  - Delivered: `README.md` with the nine sections of §12 (snippets mirror `tests/consumers`, including
    the React JSX typing owed since Phase 4), `README_JA.md` (checked with the `readme-sync` agent),
    `THIRD_PARTY_NOTICES.md` (nothing bundled; `lit` is the runtime dependency), the five Foundation
    MDX pages and the `storySort` order; the leftover `README_sample_from_another_repo.md` was
    deleted.
  - Verified: `make build-storybook` lists the five docs entries and the same 38 stories and
    clean-URL redirects; axe reports 0 violations on the Foundation pages in both themes. Component
    usage notes were already in each component's JSDoc, so no story changed.
  - Notes: the live catalog URL in the README is a placeholder for the owner's deployment. The first
    npm publish, the Cloudflare and GitHub setup and the trusted publisher are the owner's steps
    (README, "Release flow" and "One-time setup").
- **Card completed (2026-10-22)**: `su3-card` is the first post-MVP component. Details:
  `docs/2026-10-22_01_card/`.
  - Delivered: `src/shared/components/containment/card/` with the variants `elevated`, `filled` and
    `outlined`, the slots `media`, `header`, default and `actions` (empty slots collapse through
    `slotchange`), and the hooks `--su3-comp-card-*` including `text-color`; no new sys tokens.
  - Verified: 11 browser tests; axe reports 0 violations in every story and both themes (it found
    that a re-themed card needs a text-color hook, which was added); new VRT baselines reviewed.
  - Decisions: the card is a static container (no role, no focus, no click handling); an interactive
    card is a later task.
- **Badge completed (2026-10-22)**: `su3-badge`, the first component of the new `feedback` category.
  Details: `docs/2026-10-22_02_badge/`.
  - Delivered: `src/shared/components/feedback/badge/` with the tones `accent`, `subtle`, `danger`
    and `neutral`, slotted text, a numeric `count` with `max` (a truncated count is exposed as an
    image named with the full number), a `dot` (an image named by `aria-label`), and the hooks
    `--su3-comp-badge-*`; no new sys tokens.
  - Verified: 13 browser tests; axe reports 0 violations in 49 stories x 2 themes; new VRT baselines
    reviewed (the review found a neutral dot that was nearly invisible on the page, so it is
    filled with `text-muted`); `check:package` and `check:consumers` pass.
  - Notes: a first `make vrt-update` run died when Docker Desktop stopped; the rerun after
    restarting it completed.
