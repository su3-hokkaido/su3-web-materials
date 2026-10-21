import { defineConfig } from 'tsdown';

/**
 * Library build (docs/project_plan.md section 9): ESM only and unbundled, so `dist` mirrors `src`
 * (`dist/shared/components/buttons/button/button.js`, `dist/products/acme/index.js`). Keeping one
 * file per module preserves the side-effect boundary (class modules are pure, component `index.ts`
 * files register), lets consumers' bundlers tree-shake perfectly, and lets the published manifest
 * map each `src` module to the `dist` module of the same path one to one. `package.json` `exports` is derived from the
 * directory layout (scripts/lib/package-exports.ts), not generated here. Standalone CSS and the
 * manifest are produced afterwards by scripts/build-package-assets.ts.
 */
export default defineConfig({
  entry: ['src/shared/**/*.ts', 'src/products/*/index.ts', '!**/*.test.ts', '!**/*.stories.ts'],
  unbundle: true,
  format: ['esm'],
  dts: true,
  platform: 'browser',
  // Private #fields are used, so ES2022 is the baseline (every evergreen browser); lowering it
  // would only add helper code.
  target: 'es2022',
  fixedExtension: false,
  sourcemap: false,
  // The `sideEffects` field in package.json describes the *published* files (dist). During the
  // build it would mark every src module as side-effect free and drop all.ts's registering imports,
  // so tree-shaking must not consult it; the output is unbundled, so nothing is shaken anyway.
  treeshake: { moduleSideEffects: () => true },
  // dist/storybook (scripts/build-storybook-all.ts) shares the directory, so only the package
  // output is cleaned.
  clean: [
    'dist/shared',
    'dist/products',
    'dist/themes',
    'dist/tokens.css',
    'dist/custom-elements.json',
  ],
});
