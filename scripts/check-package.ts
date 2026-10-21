/**
 * Checks the built package after `pnpm run build` (docs/project_plan.md section 9). publint and
 * attw (profile `esm-only`) cover the package.json fields and type resolution; the checks below
 * cover what is specific to this library:
 *
 * - every `exports` target and the `customElements` file exist,
 * - no `.ts` import specifier is left in dist,
 * - class modules are side-effect free and every component entry registers its tag,
 * - tokens.css has the light, dark and reduced-motion blocks and each theme equals its source,
 * - the manifest lists every tag and all its module paths exist in dist,
 * - the packed files are only dist, the license and the readme, and are reported with their size.
 *
 * Usage: node scripts/check-package.ts
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { exportTargets, listComponents } from './lib/package-exports.ts';
import { manifestModulePaths } from './lib/manifest-paths.ts';
import { formatBytes } from './lib/site-limits.ts';
import { listProductIds } from './lib/products.ts';

const root = resolve(import.meta.dirname, '..');
const distDir = join(root, 'dist');
const problems: string[] = [];

function check(condition: boolean, message: string): void {
  if (!condition) problems.push(message);
}

function read(...segments: string[]): string {
  return readFileSync(join(root, ...segments), 'utf8');
}

/** Package files under dist (dist/storybook is the static site, not part of the package). */
function distFiles(dir = distDir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (path === join(distDir, 'storybook')) return [];
    return entry.isDirectory() ? distFiles(path) : [path];
  });
}

function run(label: string, args: string[]): void {
  console.log(`\n> ${label}`);
  const result = spawnSync('pnpm', ['exec', ...args], { cwd: root, stdio: 'inherit' });
  check(result.status === 0, `${label} failed.`);
}

const packageJson = JSON.parse(read('package.json')) as {
  exports: Record<string, unknown>;
  customElements: string;
};
const components = listComponents(root);

// --- exports targets ---------------------------------------------------------------------------
for (const target of [...exportTargets(packageJson.exports), packageJson.customElements]) {
  check(existsSync(join(root, target)), `${target} does not exist; run pnpm run build.`);
}

// --- JavaScript and declarations -----------------------------------------------------------------
const scripts = distFiles().filter((file) => /\.(js|d\.ts)$/.test(file));
check(scripts.length > 0, 'dist contains no JavaScript; run pnpm run build.');
for (const file of scripts) {
  const name = relative(root, file);
  const source = readFileSync(file, 'utf8');
  check(
    !/(?:from|import)\s*\(?\s*["']\.{1,2}\/[^"']*\.ts["']/.test(source),
    `${name} still imports a .ts file.`,
  );
  const isComponentEntry = /\/components\/[^/]+\/[^/]+\/index\.js$/.test(name);
  const isAll = name.endsWith('shared/all.js');
  // Only component entries (and the helper they call) may register an element; class modules and
  // the root must stay pure so that importing a class never has side effects.
  if (name.endsWith('.js') && !isComponentEntry && !isAll && !name.endsWith('define-element.js')) {
    check(
      !/customElements\.define|defineElement\(/.test(source),
      `${name} registers an element but is not a component entry.`,
    );
  }
}
for (const { name, category } of components) {
  const entry = `dist/shared/components/${category}/${name}/index.js`;
  const source = existsSync(join(root, entry)) ? read(entry) : '';
  check(source.includes(`defineElement("su3-${name}"`), `${entry} does not register su3-${name}.`);
  check(
    read('dist/shared/all.js').includes(`./components/${category}/${name}/index.js`),
    `dist/shared/all.js does not import ${name}.`,
  );
}

// --- tokens and themes ---------------------------------------------------------------------------
const tokens = existsSync(join(distDir, 'tokens.css')) ? read('dist/tokens.css') : '';
for (const needle of [
  ':root {',
  "[data-theme='dark'] {",
  '@media (prefers-color-scheme: dark)',
  '@media (prefers-reduced-motion: reduce)',
  '--su3-sys-color-accent:',
  '--su3-ref-palette-accent-700:',
]) {
  check(tokens.includes(needle), `dist/tokens.css lacks ${needle}`);
}
check(!tokens.includes('@import'), 'dist/tokens.css must not import other files.');
for (const productId of listProductIds(root)) {
  const built = join(distDir, 'themes', `${productId}.css`);
  check(
    existsSync(built) &&
      read('dist/themes', `${productId}.css`) === read('src/products', productId, 'theme.css'),
    `dist/themes/${productId}.css is missing or differs from its source.`,
  );
}

// --- manifest -----------------------------------------------------------------------------------------
const manifestPath = join(distDir, 'custom-elements.json');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    modules: { path?: string; declarations?: { tagName?: string }[] }[];
  };
  const tags = manifest.modules.flatMap((module) =>
    (module.declarations ?? []).flatMap((declaration) =>
      declaration.tagName === undefined ? [] : [declaration.tagName],
    ),
  );
  for (const { name } of components) {
    check(tags.includes(`su3-${name}`), `custom-elements.json has no declaration for su3-${name}.`);
  }
  for (const modulePath of manifestModulePaths(manifest)) {
    check(existsSync(join(root, modulePath)), `Manifest module ${modulePath} does not exist.`);
    check(!modulePath.startsWith('src/'), `Manifest module ${modulePath} points into src.`);
  }
}

// --- packed files ------------------------------------------------------------------------------------
const pack = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
  cwd: root,
  encoding: 'utf8',
});
if (pack.status === 0) {
  const [info] = JSON.parse(pack.stdout) as [
    { files: { path: string; size: number }[]; unpackedSize: number },
  ];
  const stray = info.files.filter(
    (file) =>
      !/^(dist\/|LICENSE$|package\.json$|README\.md$)/.test(file.path) ||
      file.path.startsWith('dist/storybook/'),
  );
  check(
    stray.length === 0,
    `The package would include unexpected files: ${stray.map((file) => file.path).join(', ')}`,
  );
  console.log(
    `Package: ${String(info.files.length)} files, ${formatBytes(info.unpackedSize)} unpacked`,
  );
} else {
  problems.push(`npm pack --dry-run failed: ${pack.stderr}`);
}

if (problems.length === 0) {
  // publint and attw read the real package.json and the packed tarball.
  run('publint --strict', ['publint', '--strict']);
  const entrypoints = Object.entries(packageJson.exports)
    .filter(([, value]) => typeof value === 'object')
    .map(([key]) => key);
  run('attw (esm-only)', [
    'attw',
    '--pack',
    '.',
    '--profile',
    'esm-only',
    '--entrypoints',
    ...entrypoints,
  ]);
}

if (problems.length > 0) {
  console.error(`\nPackage check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('\nPackage check passed.');
