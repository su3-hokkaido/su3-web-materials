import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Component tests run in real Chromium so Shadow DOM, focus and ElementInternals behave as they do
// for consumers (docs/project_plan.md section 11). jsdom is intentionally not used.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts', 'src/**/index.ts'],
      // Set just below the Phase 1 results (98.6% statements, 97.1% branches); raise them as the
      // suite grows rather than letting them drift down.
      thresholds: { statements: 95, branches: 90, functions: 95, lines: 95 },
    },
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
