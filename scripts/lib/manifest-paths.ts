/**
 * Rewrites a custom elements manifest (custom-elements.json) for publishing. The analyzer reads the
 * TypeScript sources, so its module paths are `src/**` `.ts` files; the package ships the
 * unbundled `dist` mirror, where the same module is `dist/**` `.js` (docs/project_plan.md section 9).
 */

const SOURCE_PATH = /^(\/?)src\/(.+)\.ts$/;

/** `src/shared/a.ts` -> `dist/shared/a.js`; a leading slash is kept; other strings are unchanged. */
export function srcToDistPath(path: string): string {
  const match = SOURCE_PATH.exec(path);
  return match ? `${match[1] ?? ''}dist/${match[2] ?? ''}.js` : path;
}

/** Keys of a manifest object whose string values are module paths. */
const PATH_KEYS = new Set(['path', 'module']);

/** Returns a copy of the manifest with every module `path` and `module` reference rewritten. */
export function rewriteManifestPaths<T>(manifest: T): T {
  if (Array.isArray(manifest)) {
    return manifest.map((item: unknown) => rewriteManifestPaths(item)) as T;
  }
  if (manifest !== null && typeof manifest === 'object') {
    return Object.fromEntries(
      Object.entries(manifest).map(([key, value]) => [
        key,
        PATH_KEYS.has(key) && typeof value === 'string'
          ? srcToDistPath(value)
          : rewriteManifestPaths(value),
      ]),
    ) as T;
  }
  return manifest;
}

/** Every module path of a manifest (`modules[].path`). */
export function manifestModulePaths(manifest: { modules?: { path?: string }[] }): string[] {
  return (manifest.modules ?? []).flatMap((module) =>
    module.path === undefined ? [] : [module.path],
  );
}
