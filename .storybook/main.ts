import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { StorybookConfig } from '@storybook/web-components-vite';

/**
 * Product whose stories are included in this build. Each product is built separately
 * (docs/project_plan.md section 4), so one Storybook contains `src/shared` plus one product.
 */
const productId = process.env.PRODUCT_ID ?? 'sample';
const productDir = resolve(import.meta.dirname, '../src/products', productId);
const hasProduct = existsSync(productDir);

// Products are introduced in Phase 3; until then the default product may not exist. An explicitly
// requested product that does not exist is still an error.
if (!hasProduct && process.env.PRODUCT_ID !== undefined) {
  throw new Error(
    `PRODUCT_ID "${productId}" does not exist under src/products. ` +
      'Create it with `make new-product PRODUCT_ID=...` or pick an existing product.',
  );
}

const config: StorybookConfig = {
  stories: [
    '../src/shared/**/*.stories.ts',
    ...(hasProduct ? [`../src/products/${productId}/**/*.stories.ts`] : []),
  ],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-themes'],
  core: { disableTelemetry: true },
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
};

export default config;
