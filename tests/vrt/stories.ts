/**
 * Pure helpers for the visual regression test (docs/project_plan.md section 11). They do not
 * import Playwright, so Vitest covers them; tests/vrt/stories.spec.ts wires them to the browser.
 */

/** Storybook globals for the theme addon (.storybook/preview.ts); every story is captured in both. */
export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** Playwright project names in playwright.config.ts. */
export const VIEWPORTS = ['desktop', 'mobile'] as const;
export type Viewport = (typeof VIEWPORTS)[number];

/** Directory name for the shared stories as the default product shows them. */
export const SHARED_SCOPE = 'shared';

/** The product whose build supplies the `shared` baselines: the package's default look. */
export const DEFAULT_PRODUCT_ID = 'sample';

/** The part of Storybook's index.json the VRT reads. */
export interface VrtStoryIndex {
  entries: Record<string, { id: string; type: string; importPath: string }>;
}

export interface VrtStory {
  /** Storybook build that serves the story (dist/storybook/{productId}). */
  productId: string;
  /** Baseline directory: `shared` (default product's shared stories) or the productId. */
  scope: string;
  id: string;
  /** Whether the story lives in src/shared (every product's build contains it). */
  shared: boolean;
}

/** Per-story settings from `parameters.vrt`. */
export interface VrtParameters {
  disable: boolean;
  viewports: readonly Viewport[];
  /**
   * Also capture this shared story in every non-default product's build. Use it for stories that
   * show a theme's effect; other shared stories are captured only from the default product.
   */
  themed: boolean;
}

/**
 * Every story to capture, sorted by scope and id. Docs entries are skipped. Shared stories are
 * listed for every product build; whether a non-default product captures one depends on
 * `parameters.vrt.themed`, which is only known at run time (see {@link skipReason}).
 */
export function collectVrtStories(
  products: readonly { productId: string; index: VrtStoryIndex }[],
): VrtStory[] {
  if (products.length > 0 && !products.some(({ productId }) => productId === DEFAULT_PRODUCT_ID)) {
    throw new Error(
      `The "${DEFAULT_PRODUCT_ID}" build is missing from dist/storybook; its shared stories are the ` +
        'reference. Run `make build-storybook` without PRODUCT_ID.',
    );
  }
  const stories: VrtStory[] = [];

  for (const { productId, index } of products) {
    for (const entry of Object.values(index.entries)) {
      if (entry.type !== 'story') {
        continue;
      }
      const shared = entry.importPath.startsWith('./src/shared/');
      const scope = shared && productId === DEFAULT_PRODUCT_ID ? SHARED_SCOPE : productId;
      stories.push({ productId, scope, id: entry.id, shared });
    }
  }

  return stories.sort((a, b) => a.scope.localeCompare(b.scope) || a.id.localeCompare(b.id));
}

/** Baseline path segments below tests/vrt/__screenshots__/{viewport}/. */
export function snapshotName(story: VrtStory, theme: Theme): [string, string] {
  return [story.scope, `${story.id}-${theme}.png`];
}

/** Every baseline the stories can produce for one viewport, as `{scope}/{file}` paths. */
export function expectedSnapshots(stories: readonly VrtStory[]): Set<string> {
  return new Set(
    stories.flatMap((story) => THEMES.map((theme) => snapshotName(story, theme).join('/'))),
  );
}

/** Why a story is not captured in this viewport, or undefined when it is. */
export function skipReason(
  story: VrtStory,
  vrt: VrtParameters,
  viewport: string,
): string | undefined {
  if (vrt.disable) {
    return 'parameters.vrt.disable';
  }
  if (!vrt.viewports.some((candidate) => candidate === viewport)) {
    return 'not in parameters.vrt.viewports';
  }
  if (story.shared && story.productId !== DEFAULT_PRODUCT_ID && !vrt.themed) {
    return 'shared story without parameters.vrt.themed: captured from the default product only';
  }
  return undefined;
}

/**
 * Validates `parameters.vrt` (`{ disable?: boolean; viewports?: Viewport[]; themed?: boolean }`). A
 * typo would otherwise silently capture or skip the story, so anything unexpected throws.
 */
export function parseVrtParameters(value: unknown): VrtParameters {
  if (value === undefined) {
    return { disable: false, viewports: VIEWPORTS, themed: false };
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('parameters.vrt must be an object.');
  }

  const {
    disable = false,
    viewports = VIEWPORTS,
    themed = false,
    ...rest
  } = value as Record<string, unknown>;
  const unknownKeys = Object.keys(rest);
  if (unknownKeys.length > 0) {
    throw new Error(`Unknown parameters.vrt keys: ${unknownKeys.join(', ')}.`);
  }
  if (typeof disable !== 'boolean') {
    throw new Error('parameters.vrt.disable must be a boolean.');
  }
  if (typeof themed !== 'boolean') {
    throw new Error('parameters.vrt.themed must be a boolean.');
  }
  if (
    !Array.isArray(viewports) ||
    viewports.length === 0 ||
    !viewports.every((viewport) => VIEWPORTS.includes(viewport as Viewport))
  ) {
    throw new Error(
      `parameters.vrt.viewports must be a non-empty array of ${VIEWPORTS.join(', ')}.`,
    );
  }

  return { disable, viewports: viewports as Viewport[], themed };
}
