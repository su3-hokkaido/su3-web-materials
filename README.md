[Japanese is here](./README_JA.md)

# su3-web-materials

A catalog of real Web Components (Lit 3 + TypeScript, Shadow DOM, CSS custom property design
tokens), shown in Storybook, deployed per product to Cloudflare Workers Static Assets and published
to npm. It is built to be reused: a contractor or employee who joins a team without a UI component
catalog can fork it, rename it and have a themable, tested, documented catalog the same day.

Live catalog: https://su3-web-materials.su3-hokkaido-2210.workers.dev/ (a fork deploys its own
copy; see [Reusing this repository](#reusing-this-repository-for-another-team)).

Components: `su3-button`, `su3-icon-button`, `su3-checkbox`, `su3-switch`, `su3-text-field` and
`su3-divider`. Form controls are form-associated (`ElementInternals`): they submit, validate, reset
and restore like native controls.

## Tech stack

- Lit 3 and TypeScript (no decorators), Shadow DOM, design tokens as CSS custom properties
  (`--su3-ref-*`, `--su3-sys-*`, `--su3-comp-*`)
- Storybook (`@storybook/web-components-vite`) with docs generated from `custom-elements.json`
- Vitest Browser Mode (real Chromium) and Playwright visual regression tests in Docker
- tsdown (unbundled ESM package), publint and attw checks, Changesets
- pnpm, Docker and Make; GitHub Actions; Cloudflare Workers Static Assets (free plan)

## Quick start

Docker is the default environment.

```sh
make setup   # copies the .env samples, builds the image, installs dependencies
make dev     # Storybook at http://localhost:5070
make ci      # the same checks as CI
```

Without Docker, install Node.js (see `.nvmrc`) and pnpm, run
`pnpm exec playwright install chromium` once, and use the `local-*` targets (`make local-install`,
`make local-dev`, `make local-ci`).

## Project structure

```text
src/shared/components/{category}/{name}/   # components shared by every product
src/shared/behaviors/                      # base classes (form association)
src/shared/styles/                         # state layer, focus ring, touch target
src/shared/tokens/                         # design tokens (ref, sys, comp helpers)
src/products/{productId}/                  # a themed product: index.ts and theme.css
deploy/                                    # Cloudflare and local nginx configuration
tests/                                     # visual regression tests and consumer fixtures
docs/                                      # specification (project_plan.md) and per-task docs
```

- A **productId** is a themed edition of the catalog (`sample` and `acme` are included). Each one
  is built into its own Storybook, with the shared components in every build.
- Catalog URLs: `/{productId}/` is the Storybook and `/{productId}/c/{category}/{component}` opens
  a component directly, for example `/sample/c/buttons/button`. The portal at `/` lists the
  products.
- Story titles are `{Category}/{Component}` (no productId) and every story file exports a
  `Default` story, because the clean URLs point at `--default`.

Each component directory contains `{name}.ts`, `{name}.styles.ts`, `{name}.stories.ts`,
`{name}.test.ts` and `index.ts`. The full specification is `docs/project_plan.md`.

## Using the package

```sh
npm install su3-web-materials
```

The package is ESM only. Import the entry of a component to register its element, or `all.js` to
register everything. Importing the package root (`su3-web-materials`) gives classes and types and
registers nothing.

### Plain HTML, Vite or any bundler

```ts
import 'su3-web-materials/tokens.css';
import 'su3-web-materials/button.js';
import type { ButtonVariant } from 'su3-web-materials';

// `document.createElement('su3-button')` is typed as Su3Button.
const button = document.createElement('su3-button');
const variant: ButtonVariant = 'filled';
button.variant = variant;
button.textContent = 'Save';
document.body.append(button);
```

In markup, use the element directly:

```html
<su3-button variant="filled">Save</su3-button>
```

`tokens.css` is optional: components carry built-in defaults, so the unthemed look works without it.

### React 19

Custom elements work in JSX. Tell TypeScript about the element's props once:

```tsx
import 'su3-web-materials/tokens.css';
import 'su3-web-materials/button.js';
import type { ButtonSize, ButtonVariant, FormSubmitterType, Su3Button } from 'su3-web-materials';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type Su3ButtonProps = DetailedHTMLProps<HTMLAttributes<Su3Button>, Su3Button> & {
  variant?: ButtonVariant;
  type?: FormSubmitterType;
  size?: ButtonSize;
  disabled?: boolean;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'su3-button': Su3ButtonProps;
    }
  }
}

export const Save = () => (
  <su3-button variant="filled" type="button" onClick={() => console.log('saved')}>
    Save
  </su3-button>
);
```

### Vue 3

Tell Vue's compiler that `su3-*` tags are custom elements (in `vite.config.ts`):

```ts
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    vue({
      template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('su3-') } },
    }),
  ],
});
```

```ts
import 'su3-web-materials/tokens.css';
import 'su3-web-materials/all.js';
```

These snippets mirror the fixtures in `tests/consumers`, which `make check-consumers` installs from
the packed tarball and tests in Chromium.

### Tokens and theming

Load `tokens.css` first, then a theme. Every look is produced by overriding tokens:

```ts
import 'su3-web-materials/tokens.css';
import 'su3-web-materials/themes/acme.css';
```

A theme overrides only `--su3-sys-*` and `--su3-comp-*` custom properties, for example
`--su3-sys-color-accent` or `--su3-comp-button-container-shape`. Dark mode follows
`prefers-color-scheme`, or set `data-theme="light"` or `data-theme="dark"` on an ancestor. The
tokens, the design language and the accessibility rules are described in the catalog's Foundation
pages.

## Reusing this repository for another team

1. Fork it or use it as a template, then rename the package (`name`, `repository`, `homepage` and
   `bugs` in `package.json`) and the repository URLs in the docs. Keep the MIT `LICENSE` and update
   the copyright holder.
2. Add your own edition with `make new-product PRODUCT_ID=yourteam` (creates
   `src/products/yourteam/index.ts` and `theme.css` and syncs the package `exports`). Override
   tokens in `theme.css`; contrast is checked by the tests.
3. Add components with the `/new-component` skill or by copying a component directory; follow
   `CLAUDE.md` and the checklist there.
4. Hosting uses Cloudflare Workers Static Assets on the free plan; the worker name comes from the
   repository variable `CLOUDFLARE_WORKER_NAME`. To deploy somewhere else, replace
   `.github/workflows/_deploy.yml` and `deploy/cloudflare/`; the build output is plain static files
   in `dist/storybook`. `make preview` serves it locally with the same URL rewrites.

### One-time setup (the repository owner)

1. **GitHub**: make `develop` the default branch; Settings > Actions > General: allow GitHub Actions
   to create and approve pull requests (or set the optional `RELEASE_TOKEN` secret); enable
   Dependabot version updates.
2. **Environments**: create `development` and `production` (protect `production`).
3. **Cloudflare**: create an API token from the "Edit Cloudflare Workers" template; add the secrets
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` and the repository variable
   `CLOUDFLARE_WORKER_NAME`; the account needs a `workers.dev` subdomain. Without the variable the
   deploy job is skipped, so forks pass CI.
4. **npm**: see the release flow below.
5. **Branch protection** for `main` and `develop`: require `Checks`, `Visual regression test` and
   `Consumer check`, and a pull request before merging.

## Release flow

Work happens on `feature/...` branches cut from `develop` and merged by pull request. Pushes to
`develop` deploy the preview Worker (`<name>-dev`) and pushes to `main` deploy production, after CI
passes.

For a change to the published package, run `make changeset` and commit the file. Merging it makes
the release workflow open a "Version Packages" pull request; merging that one tags `vX.Y.Z`,
creates a GitHub Release, publishes to npm with Trusted Publishing (no stored token) and opens a
back-merge pull request from `main` to `develop`.

**The first publish is manual**, because a trusted publisher can only be configured for a package
that already exists:

```sh
pnpm run build && pnpm run check:package
npm publish --access public    # from a clean checkout of main, once
```

Then add a trusted publisher for your repository naming the workflow file `release.yml`, and set the
repository variable `NPM_PUBLISH_REPOSITORY` to `owner/repo`. Until it is set, the release workflow
never tries to publish.

## Make commands

Run `make help` for the full list. Each target also has a `local-*` variant for the host.

| Command                | Purpose                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `make setup`           | Copy the `.env` samples, build the image, install dependencies |
| `make dev`             | Storybook dev server (http://localhost:5070)                   |
| `make preview`         | Build every product and serve it like production (:5071)       |
| `make ci`              | Analyze, format check, lint, types, tests, package, Storybook  |
| `make test`            | Browser and convention tests with coverage                     |
| `make format`          | Format with Prettier                                           |
| `make vrt`             | Visual regression test in the Playwright image                 |
| `make vrt-update`      | Update the baselines (then look at the changed images)         |
| `make build`           | Build the npm package into `dist`                              |
| `make check-package`   | Check exports, side effects, manifest, publint and attw        |
| `make check-consumers` | Install the packed package into the fixtures (needs network)   |
| `make sync-exports`    | Rewrite `package.json` `exports` from the components           |
| `make new-product`     | Scaffold `src/products/PRODUCT_ID` (needs `PRODUCT_ID`)        |
| `make changeset`       | Add a changeset for a published change                         |

## License

MIT, see [LICENSE](./LICENSE). Third-party notices are in
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md): no fonts or icons are bundled, and nothing was
copied from material-web, which only inspired the structure.
