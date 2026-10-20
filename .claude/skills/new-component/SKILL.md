---
name: new-component
description: Scaffold a new Web Component (element, styles, story, test, index) in src/shared or a product, and wire its export, following this project's conventions. Use when the user asks to add, create or scaffold a component, e.g. "add a switch to shared" or "create a shared badge".
---

# new-component

Create a component directory that satisfies the checklist in `CLAUDE.md` and
`docs/project_plan.md` §13, so that it builds, appears in Storybook, has a clean URL, is covered by
the VRT, and is exported from the package.

## Inputs

Determine these from the request; ask only if one cannot be inferred:

- **scope**: `shared` or a productId (must exist under `src/products/`; otherwise suggest
  `make new-product PRODUCT_ID=...` first).
- **category**: lower-case kebab-case directory, e.g. `buttons`, `selection`, `inputs`.
- **name**: lower-case kebab-case, e.g. `icon-button`.

Derived values:

- Base directory: `src/shared` or `src/products/{productId}`.
- Directory: `{base}/components/{category}/{name}/`.
- Tag `su3-{name}`, class `Su3{PascalName}`, tokens `--su3-comp-{name}-*`.
- Story title: `{Category}/{Component}` where `{Category}` is the category in title case
  (`buttons` -> `Buttons`) and `{Component}` the name in title case (`icon-button` -> `Icon Button`).
- Clean URL: `/{productId}/c/{category-id}/{component-id}` with Storybook's sanitized IDs
  (lower-case, non-alphanumerics to `-`). Tell the user the resulting URL.

## Steps

1. Check that the title and the tag are unused: grep `title: '{Category}/{Component}'` in
   `src/shared` and the target product, and `su3-{name}` across `src`. Stop and ask if either
   exists.
2. Check `src/shared/tokens/` for the system tokens the component needs. If a value has no token,
   add it there first (never hardcode it in the component).
3. Create the five files, following an existing component in the same scope as the model when one
   exists (the first one built in Phase 1 is the reference). Responsibilities:
   - `{name}.ts`: the `Su3{PascalName}` class extending `LitElement` (or a shared behavior mixin),
     JSDoc (`@summary`, `@slot`, `@csspart`, `@cssprop`, `@fires`), element registration, and the
     `HTMLElementTagNameMap` declaration. Follow the decorator decision recorded in
     `docs/project_plan.md` §17; confirm Lit APIs with Context7.
   - `{name}.styles.ts`: `css` template using `--su3-comp-{name}-*` with a `var()` fallback chain
     to `--su3-sys-*` and a built-in default; handle `prefers-reduced-motion` and `forced-colors`.
   - `{name}.stories.ts`: `title: '{Category}/{Component}'`, `component`/`argTypes` for the
     manifest, and an exported `Default` story (clean URLs point at `--default`).
   - `{name}.test.ts`: Vitest Browser Mode; role/label queries; cover each variant, keyboard and
     pointer behavior, disabled states, form participation (if any) and events.
   - `index.ts`: re-export the class and its types only (no registration side effects).
4. Re-export from the scope's `index.ts` and add the `./{name}.js` (or product) entry to
   `package.json` `exports`.
5. Run `make lint typecheck test` and fix failures. Then run `make vrt-update` to create the
   baselines for the new stories and tell the user which baseline files were added.
6. Mention that a changeset is needed for a user-visible addition (`make changeset`, minor).

## Rules

- Styles only through tokens and Shadow DOM; no Tailwind, Sass, hardcoded values, global CSS.
- Never copy code, tokens or text from material-web or any other project; write from scratch.
- Do not import from another product; `shared` never imports from products.
- English for all code and comments; no emojis. Respond to the user in Japanese.
