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

| Category               | Tool                                                        | Notes                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hosting (source)       | GitHub                                                      | Public repository, Actions, Releases                                                                                                              |
| Components             | Lit 3 + TypeScript                                          | `strict: true`. Shadow DOM, `ElementInternals` for form association. **Decision**: no framework other than Lit in the runtime                     |
| Styling                | Plain CSS in `css` tagged templates + CSS custom properties | Three token layers (§10). No Tailwind, no Sass, no preflight concerns: Shadow DOM isolates styles                                                 |
| Catalog                | Storybook (`@storybook/web-components-vite`)                | **Decision**: Storybook is kept as the catalog engine. Docs are generated from `custom-elements.json`                                             |
| Package manager        | pnpm                                                        | Pinned with the `packageManager` field. The Dockerfile installs that exact version with npm (Node.js 25+ no longer bundles Corepack)              |
| Runtime                | Node.js                                                     | **26** (owner decision; Active LTS from late October 2026), pinned in `.nvmrc` and `devEngines`                                                   |
| Language               | TypeScript                                                  | 6.0.x until typescript-eslint and Storybook's tooling support TypeScript 7                                                                        |
| Unit / behavior test   | Vitest **Browser Mode** (Playwright provider)               | Real Chromium, so Shadow DOM, focus, `ElementInternals` and forms behave as in production. jsdom is not used. See §11                             |
| Lint / Format          | ESLint (flat config) + Prettier                             | `eslint-plugin-lit` and `eslint-plugin-wc` are added if they support the ESLint major in use; otherwise rely on tests and the a11y addon          |
| Library build          | tsdown (Rolldown based)                                     | ESM only, one entry per component (tree-shakable), `.d.ts`, `custom-elements.json`. **Open (Phase 4)**: confirm unbundled output and CSS handling |
| Container              | Dockerfile + docker compose                                 | Local development assumes Docker (§5)                                                                                                             |
| Task runner            | Makefile                                                    | Single entry point for every command                                                                                                              |
| Deploy                 | **Cloudflare Workers Static Assets**                        | **Decision (revised)**: see §4                                                                                                                    |
| Visual regression test | Playwright `toHaveScreenshot`                               | Against the built Storybook, in Docker. See §11                                                                                                   |
| Versioning             | Changesets                                                  | SemVer (MAJOR.MINOR.PATCH)                                                                                                                        |

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
    behaviors/              # mixins: form-associated, aria delegation, activation click, ...
    components/{category}/{name}/
      {name}.ts             # element class + @customElement-equivalent registration
      {name}.styles.ts      # css`...` using --su3-comp-{name}-* tokens
      {name}.stories.ts
      {name}.test.ts
      index.ts
    index.ts                # re-exports every shared component (no side-effect registration, see below)
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
- **Side effects (Decision)**: each component's own module registers its custom element. The
  package root `index.ts` only re-exports classes and types, and consumers import
  `su3-web-materials/button.js` (registers `<su3-button>`) or use a catch-all
  `su3-web-materials/all.js`. `sideEffects` in `package.json` lists the registering modules.
- Behavior shared by many elements (form association, ARIA delegation) lives in
  `src/shared/behaviors/` as mixins; visual helpers (ripple, focus ring, elevation) are public
  components in the `foundation` category.

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
   Verify the placeholder expansion (`:category-:component`) with `wrangler dev` first and with a
   real preview deploy before marking §15 complete.
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

- Use **Workers Static Assets** (`wrangler.jsonc` with `assets.directory`; no Worker script).
- Free plan limits that matter (re-check before each phase that changes output size): **20,000
  files per Worker version**, **25 MiB per file**, 2,000 static + 100 dynamic redirects. Because
  every productId is built separately and Storybook emits many small files, **measure the file
  count in Phase 3** and, if the limit is near, reduce it (fewer products, `--test` builds, or no
  duplicated shared assets).
- Environments: `main` -> production Worker; `develop` -> a separate preview Worker (or a Worker
  preview/version URL). **Open (Phase 6)**: pick between a second Worker and Worker Previews after
  reading the current Cloudflare docs.
- Deploys: GitHub Actions + `wrangler deploy`, gated so that CI must pass first. Workers Builds
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
- Vitest Browser Mode needs Chromium: tests run in the Playwright image as well (`make test`), so
  host and CI results match.
- `local-*` targets exist for people who have Node.js on the host.

---

## 6. Makefile

`make help` lists every target. The product is selected with `PRODUCT_ID` (default `sample`).

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

| File                | Trigger                                               | Jobs                                                                                |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `ci.yml`            | `pull_request`, and `push` to `main` / `develop` only | prettier, eslint, tsc, Vitest Browser Mode, Storybook build, package build          |
| `vrt.yml`           | `pull_request`                                        | Build every Storybook -> Playwright VRT; upload the diff report on failure          |
| `deploy_dev.yml`    | push to `develop`                                     | Build every Storybook -> deploy the preview environment                             |
| `deploy_prod.yml`   | push to `main`                                        | Build every Storybook -> deploy production                                          |
| `create-d2m-pr.yml` | push to `develop`                                     | Open/update the `develop` -> `main` release PR                                      |
| `release.yml`       | push to `main`                                        | Changesets: Version Packages PR, or tag / GitHub Release / npm publish + back-merge |

- Deploy logic is confined to `deploy/cloudflare/` and the reusable `_deploy.yml`.
- Use GitHub Environments (`development`, `production`); cache the pnpm store (not in release).
- Pin every action to a full commit SHA with a `# vX.Y.Z` comment; Dependabot updates them against
  `develop`. Keep `permissions` minimal.
- Deploy jobs run only when `vars.CLOUDFLARE_WORKER_NAME` is set; the npm publish step runs only
  when `github.repository` equals `vars.NPM_PUBLISH_REPOSITORY`. These guards keep forks green.
  (Lower priority than in the previous plan: this repository is a showcase, not a template.)
- Pull requests opened with `GITHUB_TOKEN` do not trigger workflows; an optional `RELEASE_TOKEN`
  secret is used for the release, Version Packages and back-merge PRs when set.

---

## 9. Package Publishing

- Package name: **`su3-web-materials`** (unscoped). Confirm on npm that the name is unused before
  the first publish.
- `package.json` `exports` (all ESM, each with `types`):
  - `.` -> classes and types only (no registration side effects)
  - `./all.js` -> registers every shared component
  - `./{name}.js` -> one entry per component, registering its element (e.g. `./button.js`)
  - `./{productId}` -> each product's components
  - `./tokens.css` -> `--su3-ref-*` / `--su3-sys-*` defaults for `:root` (plain CSS)
  - `./themes/{productId}.css` -> each product's token overrides
  - `./custom-elements.json` -> manifest (also referenced by the `customElements` field)
- Components inject their own styles in Shadow DOM, so **no global stylesheet is required**
  except `tokens.css` (defaults). Components also fall back to built-in default values, so a
  consumer who skips `tokens.css` still gets a usable, unthemed result.
- `lit` is a `dependency` (Lit's own guidance for component packages), with a permissive range
  (`^3`) so consumers can dedupe. Components are published as standard ES2021 JavaScript.
- Entry wiring: `tsdown.config.ts` derives entries from the component directories;
  `make new-product` writes the product entry; `make ci` fails if a component or product directory
  has no matching `exports` entry.
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
- Coverage thresholds are set in Phase 1 once the first component exists.

### Visual regression (Playwright)

- `toHaveScreenshot` against the **built Storybook** (the output of `make preview`). Stories are
  enumerated from Storybook's `index.json`; each is opened at
  `iframe.html?id=<storyId>&viewMode=story`.
- Per-story settings: `parameters.vrt = { disable?: boolean; viewports?: ('desktop'|'mobile')[] }`;
  unknown keys or values fail the run.
- Stories under `src/shared` are in every product's build and are captured once, from the first
  product. Baselines: `tests/vrt/__screenshots__/{viewport}/{shared|productId}/{storyId}-{theme}.png`.
  A baseline with no matching story fails the run.
- Fixed conditions: Chromium; desktop (`Desktop Chrome` 1280x720) and mobile (`Pixel 7`); animations
  disabled; wait for fonts; light and dark themes.
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
- Foundation pages: Getting started, Theming (tokens, dark mode, productId example), Accessibility
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
1. **Foundation spike**: pnpm / TS / ESLint / Prettier / Storybook (web-components-vite) /
   Vitest Browser Mode; token files; design language doc; resolve the decorator question; build
   `su3-button` (all variants) end to end with story, test and docs.
2. **Docker / compose / Makefile** (carry over and trim; no AWS targets).
3. **Per-productId builds, portal, URL rewrite** (nginx and Cloudflare `_redirects`), `sample` and
   one contrasting product; measure the file count against the 20,000-file limit.
4. **Package build**: tsdown per-component entries, `exports`, `custom-elements.json`,
   `make new-product`, and consumer proofs of concept (plain HTML, Vite, React 19, Vue).
5. **Playwright VRT** (Docker, baselines).
6. **GitHub Actions**: CI -> VRT -> deploy to Workers -> release, with the fork guards.
7. **MVP components**: `foundation` (ripple, focus-ring, elevation, extracted as they are needed),
   IconButton, Checkbox, Switch, TextField, Divider.
8. **README / README_JA / CLAUDE.md / catalog pages**; first manual npm publish.
9. **After the MVP** (one task each, in priority order): Card, Badge, Segmented button, Navigation
   bar / drawer, Snackbar, Tooltip, Top app bar, Select, Dialog, Menu, then pickers and Data table.

## 15. Acceptance Criteria

- [ ] On a clean machine, `make setup && make dev` alone opens Storybook at http://localhost:5070
- [ ] `make preview` shows the matching story at `http://localhost:5071/sample/c/buttons/button`,
      and Storybook's own assets under `/sample/` load without being redirected
- [ ] `make test` runs the component tests in a real browser, locally and in CI, with the same result
- [ ] `make vrt` gives the same result locally (Docker) and in CI, and new stories are included
      automatically
- [ ] On Cloudflare Workers Static Assets, `/{productId}/c/{category}/{component}` works, and the
      build stays under the Free plan limits
- [ ] `make ci` succeeds, and CI runs the same checks
- [ ] Pushes to `develop` / `main` deploy automatically; the whole pipeline costs nothing
- [ ] Merging a PR with a changeset results in a tag, a Release, an npm publish and a back-merge PR
- [ ] A fork with no secrets passes CI and skips deploy / publish instead of failing
- [ ] `import 'su3-web-materials/button.js'` registers `<su3-button>` in a plain HTML page, a Vite
      app, a React 19 app and a Vue app, with working styles
- [ ] Re-theming by overriding `--su3-sys-*` works, and the contrasting product demonstrates it
- [ ] `custom-elements.json` is published and the Storybook docs are generated from it
- [ ] No source, token or documentation text from material-web is present; `THIRD_PARTY_NOTICES.md`
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
  - Opened items: decorators (Phase 1), tsdown unbundled output and CSS handling (Phase 4),
    preview environment mechanism (Phase 6).
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
