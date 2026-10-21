/**
 * The package files that tsdown does not produce (docs/project_plan.md section 9). Run after
 * `tsdown` and `cem analyze` (the `build` script does all three):
 *
 *   dist/tokens.css               the default tokens, from src/shared/tokens (same source as Storybook)
 *   dist/themes/{productId}.css   each product's theme, copied from src/products/{id}/theme.css
 *   dist/custom-elements.json     the analyzer's manifest with module paths pointing into dist
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { rewriteManifestPaths } from './lib/manifest-paths.ts';
import { listProductIds } from './lib/products.ts';
import { buildTokensCss } from '../src/shared/tokens/css.ts';

const root = resolve(import.meta.dirname, '..');
const distDir = join(root, 'dist');

const TOKENS_HEADER = `/*
 * su3-web-materials default design tokens (--su3-ref-*, --su3-sys-*).
 * Generated from src/shared/tokens by scripts/build-package-assets.ts; do not edit.
 * Load this before a product theme (themes/*.css): equal-specificity rules win by source order.
 * Components also carry built-in fallbacks, so they render (unthemed, light) without this file.
 */

`;

function main(): void {
  const written: string[] = [];

  mkdirSync(distDir, { recursive: true });
  writeFileSync(join(distDir, 'tokens.css'), TOKENS_HEADER + buildTokensCss());
  written.push('tokens.css');

  mkdirSync(join(distDir, 'themes'), { recursive: true });
  for (const productId of listProductIds(root)) {
    copyFileSync(
      join(root, 'src/products', productId, 'theme.css'),
      join(distDir, 'themes', `${productId}.css`),
    );
    written.push(`themes/${productId}.css`);
  }

  const manifest = JSON.parse(readFileSync(join(root, 'custom-elements.json'), 'utf8')) as unknown;
  writeFileSync(
    join(distDir, 'custom-elements.json'),
    `${JSON.stringify(rewriteManifestPaths(manifest), null, 2)}\n`,
  );
  written.push('custom-elements.json');

  console.log(`Wrote ${written.map((file) => relative(root, join(distDir, file))).join(', ')}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
