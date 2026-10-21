import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Two projects (docs/project_plan.md section 11):
// - `browser`: component and token tests run in real Chromium so Shadow DOM, focus and
//   ElementInternals behave as they do for consumers. jsdom is intentionally not used.
// - `conventions`: mechanical repository checks that read files, so they need Node.
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'scripts/lib/**/*.ts', 'tests/vrt/stories.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.stories.ts', 'src/**/index.ts'],
      // Set just below the Phase 1 results (98.6% statements, 97.1% branches); raise them as the
      // suite grows rather than letting them drift down.
      thresholds: { statements: 95, branches: 90, functions: 95, lines: 95 },
    },
    projects: [
      {
        test: {
          name: 'browser',
          include: ['src/**/*.test.ts'],
          exclude: ['src/conventions.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'conventions',
          // Node-side checks: repository conventions and the build scripts' helpers.
          include: ['src/conventions.test.ts', 'scripts/**/*.test.ts', 'tests/vrt/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
