// @ts-check

const hiddenStatics = new Set(['styles', 'properties', 'formAssociated', 'shadowRootOptions']);

/**
 * Removes private (`#name`) and protected members, and static plumbing (`styles`, `properties`,
 * `formAssociated`, `shadowRootOptions`), from the manifest, so the docs list only the public API.
 * @type {import('@custom-elements-manifest/analyzer').Plugin}
 */
const publicMembersOnly = {
  name: 'public-members-only',
  packageLinkPhase({ customElementsManifest }) {
    for (const module of customElementsManifest.modules) {
      for (const declaration of module.declarations) {
        if (!('members' in declaration) || !declaration.members) continue;
        declaration.members = declaration.members.filter(
          (member) =>
            !member.name.startsWith('#') &&
            !(member.static && hiddenStatics.has(member.name)) &&
            member.privacy !== 'private' &&
            member.privacy !== 'protected',
        );
      }
    }
  },
};

/** @type {import('@custom-elements-manifest/analyzer').Config} */
export default {
  globs: ['src/**/*.ts'],
  exclude: [
    'src/shared/define-element.ts',
    '**/*.test.ts',
    '**/*.stories.ts',
    'src/**/tokens/**',
    'src/conventions.test.ts',
  ],
  outdir: '.',
  litelement: true,
  plugins: [publicMembersOnly],
};
