# Third-party notices

su3-web-materials is MIT licensed (see `LICENSE`). This file lists what the published package and
the catalog bundle from other projects.

## Fonts and icons

None are bundled. Typography uses system font stacks (`--su3-ref-typeface-*`), and the icons shown
in the stories and tests are small inline SVG drawings written for this repository.

## Runtime dependency

| Package | License      | Use                                                                              |
| ------- | ------------ | -------------------------------------------------------------------------------- |
| `lit`   | BSD-3-Clause | Base for every element; installed by the consumer's package manager, not bundled |

## Development tools

Storybook, Vite, Vitest, Playwright, tsdown, Changesets and the other development dependencies are
not part of the published package. Their licenses are listed in their own packages.

## Provenance

The component structure is inspired by the public design of material-web, but no source code, Sass,
tokens, documentation text or assets were copied from it, and the names "Material" and `md-` are not
used. If a future change adds third-party code, fonts or icons, record them here with their license.
