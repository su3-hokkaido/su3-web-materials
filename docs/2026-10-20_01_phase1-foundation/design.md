# Phase 1: Foundation spike

## Background

`docs/project_plan.md` section 14 (Phase 1) asks for a working vertical slice of the new stack
before anything else is built on it: Lit Web Components (section 2), three-layer CSS tokens
(section 10), Storybook with `@storybook/web-components-vite` (sections 2 and 12), and Vitest
Browser Mode (section 11), proven end to end with one component, `su3-button`.

The repository currently holds only documentation, `.claude/` and `.github/`. Reusable
configuration lives in the sibling repository `su3-ui-component-catalog-template` (React and
Tailwind based) and is adapted, not copied blindly.

## Requirements

- `pnpm install` and `pnpm run ci` work on the host (Node.js 26, pnpm 12.14). Docker and the
  Makefile are Phase 2.
- Token files for the `ref` and `sys` layers, light and dark, and an original design language
  document in `docs/design/design-language.md`.
- `<su3-button>` with all variants, states and form/link behavior listed below.
- A Storybook story file and docs generated from `custom-elements.json`.
- Browser-mode tests that cover the behavior, with role-based queries.
- The decorator question from section 2 is resolved and recorded in section 17.

## Non-goals

Docker and Makefile (Phase 2); per-product builds, portal and redirects (Phase 3); the tsdown
package build and the full `exports` map (Phase 4); VRT (Phase 5); GitHub Actions (Phase 6); other
components and the public `foundation` parts (Phase 7); README rewrite (Phase 8).

## Technical approach and key decisions

### 1. No decorators (resolves the Open item in section 2)

Components use `static properties`, `declare`d fields whose defaults are assigned in the
constructor, and `customElements.define` guarded by `customElements.get`.

Reasoning: Lit's documentation recommends experimental decorators only "for now", and standard
decorators need the `accessor` keyword plus compiler and bundler support that differs between tsc,
Vite 8 and the custom elements manifest analyzer. Decorator-free code is plain ES2023, needs no
publish-time transform (Lit publishing guide), is compatible with `erasableSyntaxOnly`, and is read
natively by the analyzer. A spike task verifies typing, Storybook, Vitest and the analyzer; the
fallback is standard decorators with `accessor`.

### 2. One `<su3-button>` with a `variant` property (judgment call)

Not five elements. `variant`: `filled | tonal | outlined | text | elevated`; `size`: `sm | md | lg`;
`disabled`; `soft-disabled` (disabled but focusable); `href`, `target`, `download`, `rel` (link
mode renders an `<a>`); `type`: `button | submit | reset`; `name`, `value`; form association via
`ElementInternals`. Slots: default (label), `leading`, `trailing`. Parts: `button`, `label`. Fewer
files and a single tag to document; the trade-off is a larger single class, which is acceptable for
the spike and revisited if variants diverge.

### 2a. Behavior base classes instead of mixins (judgment call)

`src/shared/behaviors/` provides `FormAssociatedElement` (`ElementInternals`, `disabled`, `name`,
`value`, `<fieldset disabled>` tracking) and `FormSubmitterElement` (`type`, submit and reset).
Every consumer so far fits one hierarchy, and mixin class expressions would need explicit return
types to be emitted in declaration files. Mixins can be introduced when a control needs to combine
behaviors. Findings from the spike that shaped this code:

- A subclass `static properties` must be annotated `PropertyDeclarations`; the inferred object type
  is not assignable to the parent's.
- The form action runs in a `setTimeout` so a `preventDefault()` from a later `click` listener is
  honored; custom elements cannot be the form's submitter, so `requestSubmit()` is used and the
  `name`/`value` pair is set as the form value only for that call.
- `HTMLElement.click()` is ignored for disabled form controls, so tests dispatch the click event.

### 3. Foundation parts deferred

Ripple, focus ring and elevation stay internal (a CSS state layer and `:focus-visible` outline in
the button's styles). Extraction into public `foundation` components happens in Phase 7, when a
second consumer exists, to avoid designing the abstraction from one example.

### 4. Tokens

`src/shared/tokens/`: `ref.ts` (palette, typeface, scale), `sys.ts` (color roles for light and
dark, shape, typography, motion, elevation) as Lit `css` results, plus a plain `tokens.css`
generated at build time (Phase 4 wires the package output). Dark mode is driven by
`[data-theme="dark"]`, falling back to `prefers-color-scheme`. The button reads
`--su3-comp-button-*` with a `var()` fallback chain to `--su3-sys-*` and a built-in default.

### 5. Tooling

- TypeScript 6.0, ESLint 10 flat config (dependency-direction zones from the template are kept),
  Prettier without the Tailwind plugin.
- Vitest 5 Browser Mode with `@vitest/browser-playwright`, Chromium only; the browser is installed
  with `pnpm exec playwright install chromium`.
- `@custom-elements-manifest/analyzer` produces `custom-elements.json` (git-ignored); Storybook
  loads it with `setCustomElementsManifest`.
- Storybook `main.ts` keeps the `PRODUCT_ID` logic from the template (stories glob = `src/shared` +
  one product); the `sample` product directory is created in Phase 3, so Phase 1 treats a missing
  product directory as "shared only".

## Affected files and directories

- New: `package.json`, `pnpm-workspace.yaml`, `.nvmrc`, `.prettierrc`, `.prettierignore`,
  `tsconfig.json`, `eslint.config.js`, `vitest.config.ts`, `.storybook/`,
  `custom-elements-manifest.config.mjs`, `src/shared/{tokens,behaviors}/`,
  `src/shared/components/buttons/button/`, `src/shared/index.ts`, `src/conventions.test.ts`,
  `docs/design/design-language.md`.
- Modified: `.gitignore`, `docs/project_plan.md` (section 17 entry), `.claude/settings.json` if a new
  command needs permission.
- Design tokens: new `--su3-ref-*`, `--su3-sys-*` and `--su3-comp-button-*` properties.
- Package `exports`: only `.` (classes and types) for now; the per-component map is Phase 4.
- `custom-elements.json`: generated, not yet published.
- Story title and URL: `Buttons/Button`, clean URL `/{productId}/c/buttons/button`.
- VRT baselines: none (Phase 5). README and README_JA: unchanged (Phase 8).

## Provenance

`su3-button` and the tokens are written from scratch. material-web was inspected for structure
only (separate public tag and internal implementation, token layering, form-associated behavior as
a concept); no code, token names, values or text are reused. The design language is original.

## Open risks

- `static properties` plus `declare` fields may type-check awkwardly with `strict`; mitigated by the
  spike and the standard-decorator fallback.
- Vitest Browser Mode and Storybook both run on Vite 8; plugin versions must be compatible.
- ESLint plugins for Lit may not support ESLint 10; they are optional.
