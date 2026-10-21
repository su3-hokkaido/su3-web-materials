/**
 * Visual regression test (docs/project_plan.md section 11). Every story in the built Storybook
 * (dist/storybook/{productId}, from `pnpm run build-storybook:all`) is captured in both themes, once
 * per viewport project. Stories are enumerated from each product's index.json, so a new story is
 * covered without editing this file. Run it with `make vrt` / `make vrt-update`, which use the
 * Playwright image so that rendering matches CI.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { openStory, serveSite, siteDir } from './site.ts';
import {
  collectVrtStories,
  expectedSnapshots,
  parseVrtParameters,
  skipReason,
  snapshotName,
  THEMES,
  type VrtStory,
  type VrtStoryIndex,
} from './stories.ts';

const screenshotsDir = resolve(import.meta.dirname, '__screenshots__');

function loadStories(): VrtStory[] {
  if (!existsSync(siteDir)) {
    throw new Error('dist/storybook is missing. Run `pnpm run build-storybook:all` first.');
  }
  const products = readdirSync(siteDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(siteDir, entry.name, 'index.json')))
    .map((entry) => ({
      productId: entry.name,
      index: JSON.parse(
        readFileSync(join(siteDir, entry.name, 'index.json'), 'utf8'),
      ) as VrtStoryIndex,
    }));
  if (products.length === 0) {
    throw new Error('dist/storybook contains no Storybook build.');
  }
  return collectVrtStories(products);
}

function listBaselines(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.png'))
    .map((file) => file.split('\\').join('/'));
}

const stories = loadStories();

test.beforeEach(async ({ context }) => {
  await serveSite(context);
});

for (const story of stories) {
  for (const theme of THEMES) {
    test(`${story.scope} ${story.id} ${theme}`, async ({ page }, testInfo) => {
      const vrt = parseVrtParameters(await openStory(page, story.productId, story.id, theme));
      const reason = skipReason(story, vrt, testInfo.project.name);
      test.skip(reason !== undefined, reason);

      await expect(page).toHaveScreenshot(snapshotName(story, theme), { fullPage: true });
    });
  }
}

// Playwright requires the fixtures argument to be a destructuring pattern, even when it is unused.
// eslint-disable-next-line no-empty-pattern
test('has no baseline without a story', ({}, testInfo) => {
  const expected = expectedSnapshots(stories);
  const orphans = listBaselines(join(screenshotsDir, testInfo.project.name)).filter(
    (file) => !expected.has(file),
  );

  expect(
    orphans,
    `Delete the baselines of removed or renamed stories under tests/vrt/__screenshots__/${testInfo.project.name}/`,
  ).toEqual([]);
});
