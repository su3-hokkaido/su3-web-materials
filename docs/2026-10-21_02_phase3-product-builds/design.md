# Phase 3: Per-productId builds, portal and URL rewrite

## Background

`docs/project_plan.md` section 4 defines a productId as a themed demo: the same shared components
rendered with a different set of token overrides. Storybook URLs are natively
`/?path=/story/buttons-button--default`, so clean URLs of the form
`/{productId}/c/{category}/{component}` are provided by redirects. Section 14 (Phase 3) and
section 15 (acceptance criteria) ask for per-product builds, a portal, the redirect for nginx and
Cloudflare, `make preview`, and a check against the Workers Free file limits. Phase 2 left Docker and
the Makefile working.

## Requirements

- Two products: `sample` (the default look) and one contrasting product (`acme`) that re-themes
  through tokens only.
- `dist/storybook/{productId}/` per product, a portal at `dist/storybook/index.html` and a
  `_redirects` file at its root.
- `/{productId}/c/{category}/{component}` redirects to
  `/{productId}/?path=/story/{category}-{component}--default` in nginx (`make preview`, port 5071)
  and in Cloudflare (`_redirects`), and Storybook's own assets under `/{productId}/` are never
  redirected.
- The placeholder expansion `:category-:component` is verified with `wrangler dev`.
- The build reports the file count and size against the Workers Free limits (20,000 files, 25 MiB
  per file) and fails above them.
- The product's colors keep the contrast thresholds of the default theme.

## Non-goals

`make new-product` and the package `exports` (Phase 4), VRT (Phase 5), the deploy workflow and the
real preview deploy (Phase 6), product-only components (a product may add them later), README
(Phase 8).

## Measurements

One Storybook build (the single product built in Phase 1) is 46 files and 9 MB, with the largest
asset about 1 MB. Two products plus the portal are about 100 files, far below the 20,000-file and
25 MiB limits. The build script still enforces them (warning at 75% of the file limit), so growth is
noticed early.

## Technical approach and key decisions

### 1. Products and themes

`src/products/{id}/` contains `index.ts` (`export {}` until a product has components) and
`theme.css`. `sample` overrides nothing; its `theme.css` documents that. `acme` overrides only
`--su3-sys-*` tokens (the accent roles for light and dark, `--su3-sys-typeface-sans`) and
`--su3-comp-button-container-shape` (pill). The override blocks use the same selectors as the
default token stylesheet (`:root, [data-theme='light']`, `[data-theme='dark']` and the
`prefers-color-scheme` media block), so the theme follows the light/dark switch.

### 2. Loading a product theme in Storybook

`.storybook/main.ts` adds a Vite alias `@product-theme` to `src/products/{id}/theme.css`, or to an
empty stylesheet when the product has none. `.storybook/preview.ts` imports it. The default token
stylesheet is now prepended to `<head>`, so equal-specificity rules in a product theme win by source
order. The same rule applies to consumers: load `tokens.css` first, then the product's theme.

### 3. Theme accessibility test

`src/conventions.test.ts` (Node) parses each `src/products/*/theme.css` with `scripts/lib/theme-css.ts`,
merges its `--su3-sys-color-*` declarations over the default roles for each mode and checks the same
foreground/background pairs and thresholds as `tokens.test.ts` (4.5:1 for text, 3:1 for non-text).
It also requires plain `#rrggbb` values, only known `--su3-sys-*` names (typo guard), and identical
dark colors for the attribute and the OS-preference block. The pair list and the contrast function
live in `src/shared/tokens/contrast.ts` so both tests share them. The `acme` palette is generated with the
same OKLCH method as the default palette and recorded in comments in its `theme.css`.

### 4. Build script

`scripts/build-storybook-all.ts [productId...]`, adapted from the owner's template: it runs
`storybook build --output-dir dist/storybook/{id}` with `PRODUCT_ID` set per build (the
environment's own `PRODUCT_ID` is ignored on purpose), renders the portal from
`portal/index.html`, copies `deploy/cloudflare/_redirects`, validates product ids (lower-case
kebab-case) and clean-URL derivation (every `Default` story title must have the form
`{Category}/{Component}` and map onto the redirect rule), and prints a size report with the limit
checks. The pure helpers live in `scripts/lib/` with unit tests. `pnpm run build-storybook:all`
runs `analyze` first. `build-storybook` stays the single-product build.

### 5. Portal

`portal/index.html` is a static page (inline CSS, no component library) in the Snowfield colors,
light and dark by `prefers-color-scheme`, listing each product and its components through the
`<!-- products -->` marker.

### 6. URL rules

`deploy/cloudflare/_redirects` holds the rule with and without a trailing slash. Workers Static
Assets applies `_redirects` even when an asset exists at the path, which is why the fixed `c`
segment exists (plan section 4). `deploy/local/nginx.conf` implements the same rule with captures
restricted to the characters of sanitized ids (nginx decodes the URI before matching, and an
unrestricted capture could put control characters into the `Location` header), serves `/_redirects`
as 404 like Cloudflare, and uses relative redirects so the published host port is kept.

### 7. Cloudflare configuration

`deploy/cloudflare/wrangler.jsonc`: Workers Static Assets with `assets.directory` set to
`dist/storybook` and no Worker script. `compatibility_date` is the day the file is written, as the
Cloudflare documentation asks. `wrangler` becomes a devDependency (`workerd` is allowed in
`pnpm-workspace.yaml`). Only the local `wrangler dev` is run in this phase; deploying remains the
owner's action (Phase 6 wires the workflow).

### 8. Docker

New `build` stage (installs dependencies with a cache mount, runs `build-storybook:all`) and a final
`preview` stage (`nginxinc/nginx-unprivileged`, port 8080, serving `dist/storybook` with
`deploy/local/nginx.conf`); compose gets a `preview` service behind the `preview` profile on
`${PREVIEW_PORT:-5071}`; the Makefile gets `preview` and `build-storybook` now builds every product
(`PRODUCT_ID` optional). `dist/` is git-ignored.

### 9. Tests

`scripts/lib/*.test.ts` and `src/**/*.node.test.ts` run in the Node `conventions` project; coverage
includes `scripts/lib`. `src/conventions.test.ts` additionally checks: every product has `index.ts`
and `theme.css`; `_redirects` and `nginx.conf` express the same rule; `wrangler.jsonc` points at
`dist/storybook`; the portal template contains its marker.

## Affected files and directories

- New: `src/products/{sample,acme}/`, `src/shared/tokens/contrast.ts`, product theme test,
  `scripts/build-storybook-all.ts`, `scripts/lib/`, `portal/index.html`, `deploy/cloudflare/`
  (`_redirects`, `wrangler.jsonc`), `deploy/local/nginx.conf`.
- Modified: `.storybook/main.ts`, `.storybook/preview.ts`, `package.json` (scripts, `wrangler`),
  `pnpm-workspace.yaml`, `Dockerfile`, `compose.yaml`, `Makefile`, `vitest.config.ts`,
  `src/shared/tokens/tokens.test.ts`, `src/conventions.test.ts`, `docs/project_plan.md`,
  `CLAUDE.md`.
- Design tokens: product-level overrides only; no new default tokens.
- Package `exports` and `custom-elements.json`: unchanged. Story titles: unchanged
  (`Buttons/Button`); clean URL `/sample/c/buttons/button` and `/acme/c/buttons/button`.
- VRT baselines: none (Phase 5). README and README_JA: unchanged (Phase 8).

## Provenance

The build script, URL rules, portal template and Docker stages are adapted from the owner's own
`su3-ui-component-catalog-template`. The `acme` palette is generated here. Nothing is taken from
material-web.

## Judgment calls

- `make new-product` stays in Phase 4 because it also writes the package `exports`; the two products
  are created by hand now.
- `sample` carries an empty theme instead of none, so every product has the same file layout.
- The contrast thresholds are enforced for product themes by a test rather than left to review,
  because a theme is the easiest place to break accessibility unnoticed.
