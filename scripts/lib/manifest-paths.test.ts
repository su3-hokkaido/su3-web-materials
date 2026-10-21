import { describe, expect, it } from 'vitest';
import { manifestModulePaths, rewriteManifestPaths, srcToDistPath } from './manifest-paths.ts';

describe('srcToDistPath', () => {
  it('maps a source module to its dist module and keeps a leading slash', () => {
    expect(srcToDistPath('src/shared/components/buttons/button/button.ts')).toBe(
      'dist/shared/components/buttons/button/button.js',
    );
    expect(srcToDistPath('/src/shared/behaviors/index.ts')).toBe('/dist/shared/behaviors/index.js');
  });

  it('leaves other values alone', () => {
    for (const value of ['lit', 'dist/a.js', 'src/a.css', 'source/a.ts', 'x/src/a.ts']) {
      expect(srcToDistPath(value)).toBe(value);
    }
  });
});

describe('rewriteManifestPaths', () => {
  const manifest = {
    schemaVersion: '1.0.0',
    modules: [
      {
        kind: 'javascript-module',
        path: 'src/shared/a.ts',
        declarations: [
          {
            name: 'A',
            description: 'Lives in src/shared/a.ts but is only a description.',
            superclass: { name: 'B', module: '/src/shared/b.ts' },
          },
        ],
        exports: [{ kind: 'js', name: 'A', declaration: { name: 'A', module: 'src/shared/a.ts' } }],
      },
    ],
  };

  it('rewrites path and module references everywhere, not free text', () => {
    const rewritten = rewriteManifestPaths(manifest);
    expect(rewritten.modules[0]?.path).toBe('dist/shared/a.js');
    expect(rewritten.modules[0]?.declarations[0]?.superclass.module).toBe('/dist/shared/b.js');
    expect(rewritten.modules[0]?.exports[0]?.declaration.module).toBe('dist/shared/a.js');
    expect(rewritten.modules[0]?.declarations[0]?.description).toContain('src/shared/a.ts');
  });

  it('does not mutate its input and passes primitives through', () => {
    rewriteManifestPaths(manifest);
    expect(manifest.modules[0]?.path).toBe('src/shared/a.ts');
    expect(rewriteManifestPaths('x')).toBe('x');
    expect(rewriteManifestPaths(null)).toBeNull();
  });
});

describe('manifestModulePaths', () => {
  it('lists module paths and tolerates an empty manifest', () => {
    expect(manifestModulePaths({ modules: [{ path: 'a.js' }, {}] })).toEqual(['a.js']);
    expect(manifestModulePaths({})).toEqual([]);
  });
});
