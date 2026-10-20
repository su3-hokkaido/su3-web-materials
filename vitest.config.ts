import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Component tests run in real Chromium so Shadow DOM, focus and ElementInternals behave as they do
// for consumers (docs/project_plan.md section 11). jsdom is intentionally not used.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
