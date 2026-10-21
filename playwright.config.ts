import { defineConfig, devices } from '@playwright/test';

/**
 * Visual regression test (docs/project_plan.md section 11), run inside the Playwright image by
 * `make vrt` / `make vrt-update` against the built Storybook (dist/storybook). Chromium only, one
 * project per viewport; the project names are the viewport names used by
 * `parameters.vrt.viewports` (tests/vrt/stories.ts).
 */
export default defineConfig({
  testDir: 'tests/vrt',
  testMatch: '*.spec.ts',
  // Baselines are always rendered on Linux in the same image, so no platform suffix.
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  // A plain run (`make vrt`) never writes baselines: a missing one fails instead of being created
  // as a side effect. `make vrt-update` passes --update-snapshots=changed to write them.
  updateSnapshots: 'none',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    // Baselines and runs come from the same image, so rendering is deterministic (two runs are
    // identical) and the comparison can be strict. Playwright's default threshold (0.2) is lenient
    // enough to accept a different accent color (#006071 vs #00798e), which defeats the purpose of a
    // theme regression test.
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', threshold: 0.01, maxDiffPixels: 0 },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
