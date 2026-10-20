// @ts-check

/** @type {import('@custom-elements-manifest/analyzer').Config} */
export default {
  globs: ['src/**/*.ts'],
  exclude: ['**/*.test.ts', '**/*.stories.ts', 'src/**/tokens/**', 'src/conventions.test.ts'],
  outdir: '.',
  litelement: true,
};
