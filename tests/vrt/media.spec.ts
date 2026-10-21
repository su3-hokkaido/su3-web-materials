/**
 * Media-feature behavior that Vitest Browser Mode cannot emulate (docs/project_plan.md sections 10
 * and 11): `prefers-reduced-motion`, `forced-colors` and `pointer: coarse`. It uses the same built
 * Storybook as the screenshot spec, served from disk, and Playwright's media emulation; the
 * `mobile` project is a touch device (Pixel 7), so `pointer: coarse` is true there only.
 */
import { expect, test, type Page } from '@playwright/test';
import { openStory, serveSite } from './site.ts';

const PRODUCT = 'sample';
const STORY = 'buttons-button--default';

test.beforeEach(async ({ context }) => {
  await serveSite(context);
});

interface Computed {
  transitionDuration: string;
  beforeTransitionDuration: string;
  borderTopColor: string;
  afterContent: string;
  afterHeight: string;
  height: string;
}

/** Computed values of the button's inner control (`part="button"`) and its pseudo-elements. */
async function readControl(page: Page): Promise<Computed> {
  return page.evaluate(() => {
    const control = document
      .querySelector('su3-button')
      ?.shadowRoot?.querySelector('[part="button"]');
    if (!control) throw new Error('The button part was not rendered');
    const style = getComputedStyle(control);
    const before = getComputedStyle(control, '::before');
    const after = getComputedStyle(control, '::after');
    return {
      transitionDuration: style.transitionDuration,
      beforeTransitionDuration: before.transitionDuration,
      borderTopColor: style.borderTopColor,
      afterContent: after.content,
      afterHeight: after.height,
      height: style.height,
    };
  });
}

async function open(page: Page, options: { variant?: string } = {}): Promise<void> {
  await openStory(page, PRODUCT, STORY, 'light');
  if (options.variant) {
    await page.evaluate((variant) => {
      const host = document.querySelector('su3-button');
      host?.setAttribute('variant', variant);
    }, options.variant);
    await page.evaluate(
      () =>
        (document.querySelector('su3-button') as unknown as { updateComplete: Promise<unknown> })
          .updateComplete,
    );
  }
}

test.describe('prefers-reduced-motion', () => {
  test('transitions run by default', async ({ page }) => {
    await open(page);
    const style = await readControl(page);
    expect(style.transitionDuration).not.toBe('0s');
    expect(style.beforeTransitionDuration).not.toBe('0s');
  });

  test('transitions are off when the user prefers reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    const style = await readControl(page);
    expect(style.transitionDuration).toBe('0s');
    expect(style.beforeTransitionDuration).toBe('0s');
  });
});

// Chromium already adapts borders, the focus ring and hover for forced colors, so most of these
// tests pin the behavior the component promises (its rules in button.styles.ts are what keep it so
// in other engines). The disabled test depends on the component's own rule.
test.describe('forced-colors', () => {
  /** The color a CSS system color resolves to under the emulated forced-colors palette. */
  async function systemColor(
    page: Page,
    name: 'Highlight' | 'ButtonText' | 'GrayText',
  ): Promise<string> {
    return page.evaluate((color) => {
      const probe = document.createElement('div');
      probe.style.color = color;
      document.body.append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    }, name);
  }

  test('a transparent border stays transparent normally', async ({ page }) => {
    await open(page, { variant: 'text' });
    expect((await readControl(page)).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  });

  test('borders use ButtonText, so even a text button keeps a visible edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page, { variant: 'text' });
    expect((await readControl(page)).borderTopColor).toBe(await systemColor(page, 'ButtonText'));
  });

  test('the focus ring uses Highlight', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => {
      const control = document
        .querySelector('su3-button')
        ?.shadowRoot?.querySelector('[part="button"]');
      return control ? getComputedStyle(control).outlineColor : '';
    });
    expect(outline).toBe(await systemColor(page, 'Highlight'));
  });

  test('a disabled button uses GrayText for its label and border', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page, { variant: 'outlined' });
    await page.evaluate(() =>
      document.querySelector('su3-button')?.setAttribute('soft-disabled', ''),
    );
    await page.evaluate(
      () =>
        (document.querySelector('su3-button') as unknown as { updateComplete: Promise<unknown> })
          .updateComplete,
    );
    const gray = await systemColor(page, 'GrayText');
    const disabled = await page.evaluate(() => {
      const control = document
        .querySelector('su3-button')
        ?.shadowRoot?.querySelector('[part="button"]');
      const style = control ? getComputedStyle(control) : undefined;
      return { color: style?.color, border: style?.borderTopColor };
    });
    expect(disabled).toEqual({ color: gray, border: gray });
  });

  test('hovering uses a Highlight border, since the state layer is invisible', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'hover is not available on a touch device');
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page, { variant: 'outlined' });
    await page.locator('su3-button').hover();
    const highlight = await systemColor(page, 'Highlight');
    await expect.poll(async () => (await readControl(page)).borderTopColor).toBe(highlight);
  });
});

test.describe('pointer: coarse', () => {
  test('matches only on the touch (mobile) project', async ({ page }) => {
    await open(page);
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    expect(coarse).toBe(test.info().project.name === 'mobile');
  });

  test('extends the hit area to 44px on touch devices and not with a mouse', async ({ page }) => {
    await open(page);
    const style = await readControl(page);
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    // The visible button is 40px tall in both cases.
    expect(style.height).toBe('40px');
    if (coarse) {
      expect(style.afterContent).toBe('""');
      expect(style.afterHeight).toBe('44px');
    } else {
      expect(style.afterContent).toBe('none');
    }
  });
});
