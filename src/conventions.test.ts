/**
 * Mechanical checks for the conventions in docs/project_plan.md sections 1, 3, 4, 10 and 13. They
 * run with the other tests so that a convention violation fails `pnpm run ci`. This file reads the
 * repository, so it runs in Node (the `conventions` Vitest project), not in the browser.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const srcDir = resolve(root, 'src');
const sharedDir = resolve(srcDir, 'shared');
const productsDir = resolve(srcDir, 'products');

interface ComponentEntry {
  /** `shared` or a productId. */
  scope: string;
  scopeDir: string;
  category: string;
  /** Kebab-case component name, e.g. `icon-button`. */
  name: string;
  dir: string;
}

const kebab = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function subdirectories(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function collectComponents(scope: string, scopeDir: string): ComponentEntry[] {
  const componentsDir = join(scopeDir, 'components');
  return subdirectories(componentsDir).flatMap((category) =>
    subdirectories(join(componentsDir, category)).map((name) => ({
      scope,
      scopeDir,
      category,
      name,
      dir: join(componentsDir, category, name),
    })),
  );
}

/** `date-pickers` -> `Date Pickers`; used for story titles. */
const toWords = (kebabCase: string): string =>
  kebabCase
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** `icon-button` -> `IconButton`; used for class names. */
const toPascal = (kebabCase: string): string => toWords(kebabCase).replaceAll(' ', '');

const read = (...segments: string[]): string => readFileSync(join(...segments), 'utf8');

function readStoryTitle(storyFile: string): string | undefined {
  return /\btitle:\s*['"]([^'"]+)['"]/.exec(readFileSync(storyFile, 'utf8'))?.[1];
}

/** The JSDoc block directly above `export class {className}`, split into body and tag lines. */
function classDoc(source: string, className: string): { body: string; tags: string } | undefined {
  const pattern = new RegExp(`/\\*\\*((?:(?!\\*/)[\\s\\S])*)\\*/\\s*export class ${className}\\b`);
  const block = pattern.exec(source)?.[1];
  if (block === undefined) return undefined;
  const lines = block.split('\n').map((line) => line.replace(/^\s*\* ?/, ''));
  const firstTag = lines.findIndex((line) => line.startsWith('@'));
  const split = firstTag === -1 ? lines.length : firstTag;
  return {
    body: lines.slice(0, split).join('\n').trim(),
    tags: lines.slice(split).join('\n'),
  };
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

const products = subdirectories(productsDir);
const sharedComponents = collectComponents('shared', sharedDir);
const productComponents = products.flatMap((product) =>
  collectComponents(product, join(productsDir, product)),
);
const allComponents = [...sharedComponents, ...productComponents];

describe('component conventions', () => {
  it('finds the reference component', () => {
    expect(sharedComponents.length).toBeGreaterThan(0);
  });

  describe.each(allComponents.map((entry) => [relative(root, entry.dir), entry] as const))(
    '%s',
    (_label, entry) => {
      const { name } = entry;
      const tag = `su3-${name}`;
      const className = `Su3${toPascal(name)}`;
      const classFile = join(entry.dir, `${name}.ts`);
      const stylesFile = join(entry.dir, `${name}.styles.ts`);
      const storyFile = join(entry.dir, `${name}.stories.ts`);

      it('uses kebab-case for the category and the component name', () => {
        expect(entry.category).toMatch(kebab);
        expect(name).toMatch(kebab);
      });

      it('contains exactly the element, styles, story, test and index files', () => {
        expect(readdirSync(entry.dir).sort()).toEqual(
          [
            `${name}.ts`,
            `${name}.styles.ts`,
            `${name}.stories.ts`,
            `${name}.test.ts`,
            'index.ts',
          ].sort(),
        );
      });

      it(`declares ${className} for <${tag}> without registering it`, () => {
        const source = read(classFile);
        expect(source).toMatch(new RegExp(`export class ${className} extends `));
        expect(source).toContain(`'${tag}': ${className}`);
        expect(source).not.toMatch(/customElements\.define|defineElement\(/);
      });

      it('registers the element in the component entry and re-exports the class', () => {
        const index = read(entry.dir, 'index.ts');
        expect(index).toContain(`defineElement('${tag}', ${className})`);
        expect(index).toContain(`export { ${className}`);
      });

      it('documents the element for the manifest: body, @tagname, @summary', () => {
        const doc = classDoc(read(classFile), className);
        expect(doc, `${className} needs a JSDoc block`).toBeDefined();
        // The analyzer ignores an @description tag, so the description is the block body.
        expect(doc?.body.length ?? 0).toBeGreaterThan(40);
        expect(doc?.tags).toContain(`@tagname ${tag}`);
        expect(doc?.tags).toMatch(/@summary \S/);
      });

      it('styles with tokens only', () => {
        const css = readFileSync(stylesFile, 'utf8');
        expect(css, 'color literals belong in src/shared/tokens').not.toMatch(
          /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(/,
        );
        expect(css).not.toContain('!important');
        // Only su3 tokens and private (--_) properties may be read.
        expect(css).not.toMatch(/var\(--(?!su3-|_)/);
      });

      it('has a {Category}/{Component} story title, a Default story and the manifest tag', () => {
        const source = readFileSync(storyFile, 'utf8');
        expect(readStoryTitle(storyFile)).toBe(`${toWords(entry.category)}/${toWords(name)}`);
        expect(source).toMatch(/export const Default\b/);
        expect(source).toContain(`component: '${tag}'`);
      });

      it("is re-exported from its scope's index.ts", () => {
        const scopeIndex = read(entry.scopeDir, 'index.ts');
        expect(scopeIndex).toContain(`'./components/${entry.category}/${name}/${name}.ts'`);
      });
    },
  );

  it('keeps story titles unique across src/shared and every product build', () => {
    const titlesOf = (entries: ComponentEntry[]): (string | undefined)[] =>
      entries.map((entry) => readStoryTitle(join(entry.dir, `${entry.name}.stories.ts`)));

    expect(new Set(titlesOf(sharedComponents)).size).toBe(sharedComponents.length);
    for (const product of products) {
      const build = [...sharedComponents, ...productComponents.filter((c) => c.scope === product)];
      expect(new Set(titlesOf(build)).size, `build for "${product}"`).toBe(build.length);
    }
  });

  it.each(products)(
    'uses a kebab-case productId, because "%s" is a URL path segment',
    (product) => {
      expect(product).toMatch(kebab);
    },
  );
});

describe('provenance (docs/project_plan.md section 1)', () => {
  const files = sourceFiles(srcDir).filter((file) => !file.endsWith('conventions.test.ts'));

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("uses none of material-web's names: no md- tags or --md- properties", () => {
    const offenders = files.filter((file) =>
      /--md-|(?<![\w-])md-[a-z]|material design/i.test(readFileSync(file, 'utf8')),
    );
    expect(offenders.map((file) => relative(root, file))).toEqual([]);
  });

  it('prefixes every custom element tag with su3-', () => {
    const tags = files.flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/defineElement\('([^']+)'/g)].map(
        (match) => match[1],
      ),
    );
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) expect(tag).toMatch(/^su3-/);
  });
});

describe('toolchain pins', () => {
  const packageJson = JSON.parse(read(root, 'package.json')) as {
    engines?: unknown;
    devEngines?: { runtime?: { name?: string; version?: string } };
    devDependencies?: Record<string, string>;
  };

  it('pins one Node.js major for development without constraining consumers', () => {
    const nvmrc = read(root, '.nvmrc').trim();
    const runtime = packageJson.devEngines?.runtime;
    // engines would be published; the components do not depend on the Node.js version.
    expect(packageJson.engines).toBeUndefined();
    expect(runtime?.name).toBe('node');
    expect(runtime?.version).toBe(`>=${nvmrc} <${String(Number(nvmrc) + 1)}`);
  });

  // The Dockerfile arrives in Phase 2; these checks apply once it exists.
  const dockerfile = existsSync(join(root, 'Dockerfile')) ? read(root, 'Dockerfile') : undefined;

  it.runIf(dockerfile !== undefined)('uses the pinned Node.js major in the Dockerfile', () => {
    expect(/^ARG NODE_VERSION=(\S+)$/m.exec(dockerfile ?? '')?.[1]).toBe(
      read(root, '.nvmrc').trim(),
    );
  });

  it.runIf(dockerfile !== undefined)(
    'runs the VRT in the Playwright image that matches @playwright/test',
    () => {
      const tag = /^FROM mcr\.microsoft\.com\/playwright:v(\S+?)-\S+ AS vrt$/m.exec(
        dockerfile ?? '',
      )?.[1];
      // Bump both together, or the browser build differs from the one the baselines came from.
      expect(tag).toBe(packageJson.devDependencies?.['@playwright/test']);
    },
  );
});
