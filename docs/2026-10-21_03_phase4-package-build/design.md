# Phase 4: Package build

## Background

`docs/project_plan.md` section 9 (package publishing) and section 14 (Phase 4) turn the repository
into a publishable npm package. Today `package.json` is `private`, has no `exports` and nothing is
built. Section 2 left two items open for this phase: whether tsdown can emit unbundled output, and
how CSS is handled. Docker, Storybook, per-product builds and `make ci` already work (Phases 2 and 3).

## Requirements

- `pnpm run build` (and `make build`) emits ESM JavaScript and TypeScript declarations for every
  component, the root, `all` and each product, plus `tokens.css`, one theme CSS file per product and
  `custom-elements.json`.
- `package.json` `exports` provides: `.` (classes and types, registers nothing), `./all.js`,
  `./{component}.js` (registers the element), `./{productId}`, `./tokens.css`,
  `./themes/{productId}.css`, `./custom-elements.json`, `./package.json`. The map is derived from the
  directory layout and checked by tests.
- `publint --strict` and `attw` (profile `esm-only`) pass; a project-specific check covers the rest.
- `make new-product PRODUCT_ID=...` scaffolds a product and its export.
- Consumer proofs of concept (plain HTML, Vite, React 19, Vue) import `su3-web-materials/button.js`
  from an installed tarball and render a styled `<su3-button>`.

## Non-goals

The real publish, the Changesets release flow and CI wiring (Phase 6), the README (Phase 8), VRT
(Phase 5), framework wrapper packages (out of scope, plan section 9), and new components.

## Technical approach and key decisions

### 1. Unbundled output (resolves the open item in section 2)

tsdown with `unbundle: true` and a glob entry (`src/shared/**/*.ts` and `src/products/*/index.ts`,
excluding tests and stories) mirrors `src` into `dist`: for example
`dist/shared/components/buttons/button/button.js` and `dist/products/acme/index.js`. Format is ESM
only; extensions are `.js` and `.d.ts` (`fixedExtension: false`) to match the documented import
paths. Reasons: every module remains one file, so the boundary the code already has (class modules
are side-effect free, the component `index.ts` registers) survives; consumers' bundlers tree-shake
perfectly; the output is debuggable; and the manifest's module paths map one to one from
`src/**/*.ts` to `dist/**/*.js`. The first task is a spike that verifies the emitted JavaScript and
declarations (relative `./x.ts` specifiers must become `./x.js` in both). Fallback if declarations
are wrong: tsdown for JavaScript plus `tsc --emitDeclarationOnly` for types.

### 2. CSS handling (resolves the second open item)

Component styles are `css` templates inside JavaScript, so there is no CSS pipeline. Standalone CSS
comes from a post-build script: `dist/tokens.css` is `buildTokensCss()` (the same source Storybook
uses), and `dist/themes/{productId}.css` is copied from `src/products/{id}/theme.css`. Consumers
load `tokens.css` first and a theme after it.

### 3. Target ES2022

Plan section 9 said ES2021. The code uses private `#fields`, which every evergreen browser supports;
down-leveling would only add WeakMap helpers. The plan is updated.

### 4. Exports map

Derived by `scripts/lib/package-exports.ts` from `src/shared/components/*/*/index.ts` (the export
name is the component directory name, e.g. `./button.js`) and `src/products/*`. JavaScript entries
are `{ "types": ..., "default": ... }` because the package is ESM only. A component and a product
with the same name are rejected, as is a product named like a reserved entry. Also set: `files`
(`dist`, excluding `dist/storybook`), `sideEffects` (only the registering entries and CSS),
`types`, `customElements` and `publishConfig.access: public`. `private` is removed: publishing stays
the owner's manual step (plan section 9) and Claude never publishes.

`src/shared/all.ts` imports every component entry; a convention test fails when a component is
missing from it.

### 5. Published manifest

`dist/custom-elements.json` is the analyzer output with module paths rewritten from `src/**/*.ts` to
`dist/**/*.js` by a pure helper in `scripts/lib`. The Storybook copy keeps source paths.

### 6. Checks

`publint --strict`; `attw --pack . --profile esm-only` with the CSS and JSON entries excluded; and
`scripts/check-package.ts`, which verifies: every `exports` target exists; no `.ts` import specifier
remains in `dist`; class modules do not register elements while component entries do; `tokens.css`
holds the light, dark and reduced-motion blocks; each theme equals its source; the manifest lists
every tag and its module paths exist; the packed file list and size are reported. `pnpm run ci`
gains `build` and `check:package`.

### 7. Consumer proofs of concept

`tests/consumers/{plain-html,vite,react,vue}` are small projects; `scripts/check-consumers.ts` packs
the tarball, copies each fixture to a temporary directory outside the repository, installs the
tarball with npm (a flat `node_modules`, which the plain-HTML import map needs), builds with Vite
where applicable, serves the result statically and drives Chromium with Playwright. Each asserts:
the element is defined; the button's computed background is the default accent (in plain HTML with
no `tokens.css`, which also proves the built-in fallbacks); and one fixture loads
`themes/acme.css` and gets the violet accent. The React 19 and Vue fixtures show the integration
(JSX intrinsic-element typing, `isCustomElement`) and type-check with `tsc`. This is a separate
script (`check:consumers`, `make check-consumers`) because it needs the network and Chromium; it is
not part of `ci` and becomes its own CI job in Phase 6.

### 8. `make new-product`

`scripts/new-product.ts <productId>` validates the id, creates `src/products/{id}/index.ts` and
`theme.css`, and rewrites the `exports` map. The Makefile gets `new-product`, `build`,
`check-package`, `check-consumers` and the `local-*` twins.

## Affected files and directories

- New: `tsdown.config.ts`, `src/shared/all.ts`, `scripts/{build-package-assets,check-package,
check-consumers,new-product}.ts`, `scripts/lib/{package-exports,manifest-paths}.ts` with tests,
  `tests/consumers/`.
- Modified: `package.json` (fields, scripts, devDependencies), `Makefile`, `src/conventions.test.ts`,
  `.claude/skills/new-component/SKILL.md`, `CLAUDE.md`, `.gitignore` if needed,
  `docs/project_plan.md` (sections 2, 9, 14, 15, 17).
- Design tokens: unchanged. Story titles and clean URLs: unchanged. VRT baselines: none.
- Package `exports` and `custom-elements.json`: introduced here. README and README_JA: unchanged
  (Phase 8).

## Provenance

The exports helper and the package check are adapted from the owner's
`su3-ui-component-catalog-template`; the build, the consumer fixtures and the manifest rewrite are
new. Nothing is taken from material-web.

## Judgment calls

- `private` is removed now so `pnpm pack` and the checks work on the real manifest; nothing is
  published without the owner running it.
- The consumer check is not in `ci` (network, Chromium, minutes) but is a first-class script and
  target; Phase 6 wires it as a separate job.
- The published manifest is a rewritten copy rather than a second analyzer run on `dist`, because
  the analyzer reads TypeScript sources for types, defaults and JSDoc.
