/**
 * What the Playwright specs share (docs/project_plan.md section 11): the built Storybook is served
 * from disk through request routing, so no web server is needed, and a story is opened and awaited
 * the same way by the screenshot spec and the media-feature spec. Playwright-only code; the pure
 * helpers are in stories.ts.
 */
import { existsSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { expect, type BrowserContext, type Page } from '@playwright/test';
import type { Theme } from './stories.ts';

export const siteDir = resolve(import.meta.dirname, '../../dist/storybook');
export const origin = 'http://storybook.vrt';

/** The file under dist/storybook that a request URL points at, or undefined (served as 404). */
export function siteFile(url: string): string | undefined {
  let path: string;
  try {
    path = decodeURIComponent(new URL(url).pathname);
  } catch {
    return undefined;
  }
  const file = resolve(siteDir, `.${path}`);
  const rel = relative(siteDir, file);
  if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) {
    return undefined;
  }
  return existsSync(file) && statSync(file).isFile() ? file : undefined;
}

/** Serves dist/storybook at {@link origin} for every request of the context. */
export async function serveSite(context: BrowserContext): Promise<void> {
  await context.route(`${origin}/**`, async (route) => {
    const file = siteFile(route.request().url());
    await (file ? route.fulfill({ path: file }) : route.fulfill({ status: 404 }));
  });
}

export function storyUrl(productId: string, storyId: string, theme: Theme): string {
  return `${origin}/${productId}/iframe.html?id=${storyId}&viewMode=story&globals=theme:${theme}`;
}

/**
 * Opens a story and waits until it is fully rendered: Storybook's render phase, the web fonts, and
 * every `su3-*` element's `updateComplete`. Storybook has no public API for the first, so the
 * preview's current render is read; an upgrade that changes it fails here. Returns the story's
 * `parameters.vrt`.
 */
export async function openStory(
  page: Page,
  productId: string,
  storyId: string,
  theme: Theme,
): Promise<unknown> {
  await page.goto(storyUrl(productId, storyId, theme));
  const phase = await page
    .waitForFunction(() => {
      const preview = (
        globalThis as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } }
      ).__STORYBOOK_PREVIEW__;
      const current = preview?.currentRender?.phase;
      return current === 'finished' || current === 'errored' || current === 'aborted'
        ? current
        : undefined;
    })
    .then((handle) => handle.jsonValue());
  expect(phase, `story ${storyId} failed to render`).toBe('finished');
  await expect(page.locator('body')).not.toHaveClass(/sb-show-errordisplay/);

  // A custom element that is never defined renders as plain text and would be baselined as such
  // (this happened when the build dropped the registering imports), so it is an error.
  const undefinedTags = await page.evaluate(() =>
    [
      ...new Set(
        [...document.querySelectorAll('*')]
          .map((element) => element.localName)
          .filter((tag) => tag.startsWith('su3-') && customElements.get(tag) === undefined),
      ),
    ].sort(),
  );
  expect(undefinedTags, `story ${storyId} uses custom elements that are not defined`).toEqual([]);

  return page.evaluate(async () => {
    await document.fonts.ready;
    const updates = [...document.querySelectorAll('*')]
      .filter((element) => element.localName.startsWith('su3-'))
      .map(
        (element) =>
          (element as Element & { updateComplete?: Promise<unknown> }).updateComplete ??
          Promise.resolve(),
      );
    await Promise.all(updates);
    const preview = (
      globalThis as {
        __STORYBOOK_PREVIEW__?: {
          currentRender?: { story?: { parameters?: Record<string, unknown> } };
        };
      }
    ).__STORYBOOK_PREVIEW__;
    return preview?.currentRender?.story?.parameters?.['vrt'];
  });
}
