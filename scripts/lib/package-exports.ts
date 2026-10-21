/**
 * The package.json `exports` map and the related publishing fields (docs/project_plan.md section
 * 9), derived from the directory layout so that tsdown.config.ts, scripts/sync-package-exports.ts,
 * scripts/new-product.ts and the conventions test agree on them. The map is never written by hand:
 * add a component or a product and run `pnpm run sync:exports`.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** A JavaScript entry: ESM only, so a single `default` condition next to `types`. */
export interface EntryTarget {
  types: string;
  default: string;
}

export type PackageExports = Record<string, EntryTarget | string>;

export interface ComponentRef {
  /** Directory name, which is also the export name (`./{name}.js`). */
  name: string;
  /** Category directory under src/shared/components. */
  category: string;
}

/** Product ids that would collide with a fixed export. */
const RESERVED_PRODUCT_IDS = ['all', 'tokens', 'themes', 'custom-elements', 'package'];

/** Fields that decide what is published and how bundlers treat the package. */
export const PUBLISH_FIELDS = {
  files: ['dist', '!dist/storybook'],
  // Only the registering entries (and CSS) have side effects; class modules are pure, so
  // bundlers may drop unused imports of them.
  sideEffects: ['./dist/shared/all.js', './dist/shared/components/*/*/index.js', '*.css'],
  types: './dist/shared/index.d.ts',
  customElements: './dist/custom-elements.json',
  publishConfig: { access: 'public' },
} as const;

function subdirectories(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/** Every shared component: `src/shared/components/{category}/{name}`, sorted by name. */
export function listComponents(root: string): ComponentRef[] {
  const base = join(root, 'src/shared/components');
  return subdirectories(base)
    .flatMap((category) => subdirectories(join(base, category)).map((name) => ({ name, category })))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Export condition for a module at `dist/{path}.js` with declarations next to it. */
export function entryTarget(path: string): EntryTarget {
  return { types: `./dist/${path}.d.ts`, default: `./dist/${path}.js` };
}

/** Path (without extension) of a component's registering entry inside dist. */
export function componentEntryPath(component: ComponentRef): string {
  return `shared/components/${component.category}/${component.name}/index`;
}

/**
 * The full `exports` map: the root, `all`, one entry per component, one per product (with its
 * theme), then the generated stylesheet and manifest. Throws when names collide.
 */
export function expectedExports(
  components: readonly ComponentRef[],
  productIds: readonly string[],
): PackageExports {
  const componentNames = new Set<string>();
  for (const { name } of components) {
    if (componentNames.has(name)) throw new Error(`Two components are named "${name}".`);
    componentNames.add(name);
  }
  for (const productId of productIds) {
    if (componentNames.has(productId)) {
      throw new Error(`The product "${productId}" has the same name as a component.`);
    }
    if (RESERVED_PRODUCT_IDS.includes(productId)) {
      throw new Error(`"${productId}" is reserved and cannot be a productId.`);
    }
  }

  const exports: PackageExports = {
    '.': entryTarget('shared/index'),
    './all.js': entryTarget('shared/all'),
  };
  for (const component of [...components].sort((a, b) => a.name.localeCompare(b.name))) {
    exports[`./${component.name}.js`] = entryTarget(componentEntryPath(component));
  }
  const sortedProducts = [...productIds].sort();
  for (const productId of sortedProducts) {
    exports[`./${productId}`] = entryTarget(`products/${productId}/index`);
  }
  exports['./tokens.css'] = './dist/tokens.css';
  for (const productId of sortedProducts) {
    exports[`./themes/${productId}.css`] = `./dist/themes/${productId}.css`;
  }
  exports['./custom-elements.json'] = './dist/custom-elements.json';
  exports['./package.json'] = './package.json';
  return exports;
}

/** Every string leaf of a (conditional) `exports` value. */
export function exportTargets(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (value !== null && typeof value === 'object')
    return Object.values(value).flatMap(exportTargets);
  return [];
}
