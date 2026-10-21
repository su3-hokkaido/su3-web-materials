import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createProduct } from './new-product.ts';

describe('createProduct', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'new-product-'));
    mkdirSync(join(root, 'src/shared/components/buttons/button'), { recursive: true });
    mkdirSync(join(root, 'src/products/sample'), { recursive: true });
    writeFileSync(join(root, 'package.json'), `${JSON.stringify({ name: 'x', exports: {} })}\n`);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const exportsOf = (): Record<string, unknown> =>
    (
      JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
        exports: Record<string, unknown>;
      }
    ).exports;

  it('creates the index and theme and adds the exports', () => {
    const created = createProduct(root, 'acme-web');
    expect(created).toEqual(['src/products/acme-web/index.ts', 'src/products/acme-web/theme.css']);
    expect(readFileSync(join(root, 'src/products/acme-web/theme.css'), 'utf8')).toContain(
      'override design tokens',
    );
    expect(Object.keys(exportsOf())).toEqual(
      expect.arrayContaining(['./button.js', './acme-web', './sample', './themes/acme-web.css']),
    );
  });

  it('rejects a bad id, an existing product, a component name and a reserved id', () => {
    expect(() => createProduct(root, 'Acme')).toThrow('kebab-case');
    expect(() => createProduct(root, 'sample')).toThrow('already exists');
    expect(() => createProduct(root, 'button')).toThrow('same name as a component');
    expect(() => createProduct(root, 'tokens')).toThrow('reserved');
  });

  it('writes nothing when the id is rejected', () => {
    expect(() => createProduct(root, 'button')).toThrow();
    expect(existsSync(join(root, 'src/products/button'))).toBe(false);
    expect(exportsOf()).toEqual({});
  });
});
