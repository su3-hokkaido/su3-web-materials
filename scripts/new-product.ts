/**
 * Scaffolds a productId (docs/project_plan.md sections 3, 4 and 9).
 *
 * Usage: node scripts/new-product.ts <productId>
 *
 * Creates src/products/{productId}/index.ts and theme.css, and rewrites package.json `exports`
 * with the product's entry and theme. Storybook, the ESLint dependency rules, the site build and
 * the package build pick the product up from the directory list; add components with
 * /new-component and edit theme.css to re-theme the catalog.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { expectedExports, listComponents } from './lib/package-exports.ts';
import { listProductIds } from './lib/products.ts';
import { isValidProductId } from './lib/storybook-site.ts';
import { syncPackageExports } from './sync-package-exports.ts';

const INDEX_SOURCE = `// Public API of this product, published as the package sub-path of the same name. Re-export each
// product-only component here once there are any, for example:
// export { Su3Example } from './components/{category}/{name}/{name}.ts';
export {};
`;

const THEME_SOURCE = `/*
 * Theme of this product: override design tokens here and nothing else.
 *
 * - Use the same selectors as tokens.css (docs/design/design-language.md), so the theme follows the
 *   light/dark switch: \`:root, [data-theme='light']\`, \`[data-theme='dark']\` and the
 *   \`@media (prefers-color-scheme: dark)\` block with \`:root:not([data-theme])\`.
 * - Override \`--su3-sys-*\` tokens (and, rarely, \`--su3-comp-*\` hooks). Write colors as plain
 *   #rrggbb: src/conventions.test.ts reads them and requires the contrast thresholds (4.5:1 for text,
 *   3:1 for non-text) in light and dark.
 * - See src/products/acme/theme.css for a complete example.
 */
`;

/** Creates the product and syncs the package exports; throws before writing anything on a bad id. */
export function createProduct(root: string, productId: string): string[] {
  if (!isValidProductId(productId)) {
    throw new Error(`productId must be lower-case kebab-case (e.g. acme-web): "${productId}"`);
  }
  const productDir = join(root, 'src/products', productId);
  if (existsSync(productDir)) {
    throw new Error(`${relative(root, productDir)} already exists.`);
  }
  // Validates name clashes (a component with the same name, reserved ids) before anything is written.
  expectedExports(listComponents(root), [...listProductIds(root), productId]);

  mkdirSync(productDir, { recursive: true });
  writeFileSync(join(productDir, 'index.ts'), INDEX_SOURCE);
  writeFileSync(join(productDir, 'theme.css'), THEME_SOURCE);
  syncPackageExports(root);
  return [join(productDir, 'index.ts'), join(productDir, 'theme.css')].map((file) =>
    relative(root, file),
  );
}

if (import.meta.main) {
  try {
    const [productId, ...extra] = process.argv.slice(2);
    if (productId === undefined || extra.length > 0) {
      throw new Error('Usage: node scripts/new-product.ts <productId>');
    }
    const root = resolve(import.meta.dirname, '..');
    const created = createProduct(root, productId);
    console.log(
      `Created ${created.join(' and ')} and the exports "./${productId}" and "./themes/${productId}.css".`,
    );
    console.log(`Next: edit the theme, then run make dev PRODUCT_ID=${productId}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
