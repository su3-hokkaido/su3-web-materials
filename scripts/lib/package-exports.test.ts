import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  componentEntryPath,
  entryTarget,
  expectedExports,
  exportTargets,
  listComponents,
} from './package-exports.ts';

const button = { name: 'button', category: 'buttons' };
const checkbox = { name: 'checkbox', category: 'selection' };

describe('entryTarget', () => {
  it('points at the JavaScript and declaration files of a dist module', () => {
    expect(entryTarget('shared/all')).toEqual({
      types: './dist/shared/all.d.ts',
      default: './dist/shared/all.js',
    });
  });
});

describe('expectedExports', () => {
  it('lists the root, all, components, products, themes and the fixed files in order', () => {
    const exports = expectedExports([checkbox, button], ['sample', 'acme']);
    expect(Object.keys(exports)).toEqual([
      '.',
      './all.js',
      './button.js',
      './checkbox.js',
      './acme',
      './sample',
      './tokens.css',
      './themes/acme.css',
      './themes/sample.css',
      './custom-elements.json',
      './package.json',
    ]);
  });

  it('maps a component to its registering entry and a product to its index', () => {
    const exports = expectedExports([button], ['acme']);
    expect(exports['./button.js']).toEqual({
      types: './dist/shared/components/buttons/button/index.d.ts',
      default: './dist/shared/components/buttons/button/index.js',
    });
    expect(exports['./acme']).toEqual(entryTarget('products/acme/index'));
    expect(exports['./themes/acme.css']).toBe('./dist/themes/acme.css');
    expect(exports['.']).toEqual(entryTarget('shared/index'));
  });

  it('rejects duplicate component names, a product named like a component and reserved ids', () => {
    expect(() => expectedExports([button, { name: 'button', category: 'other' }], [])).toThrow(
      'Two components',
    );
    expect(() => expectedExports([button], ['button'])).toThrow('same name as a component');
    for (const reserved of ['all', 'tokens', 'themes', 'custom-elements', 'package']) {
      expect(() => expectedExports([], [reserved])).toThrow('reserved');
    }
  });
});

describe('exportTargets', () => {
  it('collects every string leaf', () => {
    expect(exportTargets(expectedExports([button], []))).toContain('./dist/shared/all.js');
    expect(exportTargets('x')).toEqual(['x']);
    expect(exportTargets(null)).toEqual([]);
  });
});

describe('componentEntryPath', () => {
  it('builds the path of the component index inside dist', () => {
    expect(componentEntryPath(button)).toBe('shared/components/buttons/button/index');
  });
});

describe('listComponents', () => {
  let root: string | undefined;

  afterEach(() => {
    if (root !== undefined) rmSync(root, { recursive: true, force: true });
  });

  it('lists component directories sorted by name and tolerates a missing folder', () => {
    root = mkdtempSync(join(tmpdir(), 'components-'));
    expect(listComponents(root)).toEqual([]);
    for (const dir of ['selection/checkbox', 'buttons/button', 'buttons/icon-button']) {
      mkdirSync(join(root, 'src/shared/components', dir), { recursive: true });
    }
    expect(listComponents(root).map((component) => component.name)).toEqual([
      'button',
      'checkbox',
      'icon-button',
    ]);
  });
});
