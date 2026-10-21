/**
 * Rewrites package.json `exports` from the directory layout (docs/project_plan.md section 9): one
 * entry per component, per product and per product theme. Run it after adding a component or a
 * product (`make new-product` does it for products):
 *
 *   node scripts/sync-package-exports.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expectedExports, listComponents } from './lib/package-exports.ts';
import { listProductIds } from './lib/products.ts';

const root = resolve(import.meta.dirname, '..');

/** Rewrites `exports` in package.json and returns whether the file changed. */
export function syncPackageExports(projectRoot = root): boolean {
  const path = join(projectRoot, 'package.json');
  const before = readFileSync(path, 'utf8');
  const packageJson = JSON.parse(before) as Record<string, unknown>;
  packageJson['exports'] = expectedExports(
    listComponents(projectRoot),
    listProductIds(projectRoot),
  );
  const after = `${JSON.stringify(packageJson, null, 2)}\n`;
  if (after === before) return false;
  writeFileSync(path, after);
  return true;
}

if (import.meta.main) {
  try {
    console.log(syncPackageExports() ? 'Updated package.json exports.' : 'exports is up to date.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
