import { describe, expect, it } from 'vitest';
import {
  collectVrtStories,
  expectedSnapshots,
  parseVrtParameters,
  skipReason,
  snapshotName,
  VIEWPORTS,
  type VrtStory,
  type VrtStoryIndex,
} from './stories.ts';

function index(...entries: [id: string, type: string, importPath: string][]): VrtStoryIndex {
  return {
    entries: Object.fromEntries(
      entries.map(([id, type, importPath]) => [id, { id, type, importPath }]),
    ),
  };
}

const button = './src/shared/components/buttons/button/button.stories.ts';
const card = './src/products/zeta/components/cards/card/card.stories.ts';

describe('collectVrtStories', () => {
  it('lists shared stories from every build, under shared only for the default product', () => {
    const stories = collectVrtStories([
      {
        productId: 'zeta',
        index: index(
          ['buttons-button--default', 'story', button],
          ['cards-card--default', 'story', card],
        ),
      },
      {
        productId: 'sample',
        index: index(
          ['buttons-button--docs', 'docs', button],
          ['buttons-button--variants', 'story', button],
          ['buttons-button--default', 'story', button],
        ),
      },
    ]);

    expect(stories).toEqual([
      { productId: 'sample', scope: 'shared', id: 'buttons-button--default', shared: true },
      { productId: 'sample', scope: 'shared', id: 'buttons-button--variants', shared: true },
      { productId: 'zeta', scope: 'zeta', id: 'buttons-button--default', shared: true },
      { productId: 'zeta', scope: 'zeta', id: 'cards-card--default', shared: false },
    ]);
  });

  it('returns nothing without products', () => {
    expect(collectVrtStories([])).toEqual([]);
  });

  it('fails when the default product build is missing, because it is the reference', () => {
    expect(() =>
      collectVrtStories([{ productId: 'zeta', index: index(['a--default', 'story', button]) }]),
    ).toThrow('"sample" build is missing');
  });
});

describe('snapshotName and expectedSnapshots', () => {
  const story: VrtStory = { productId: 'sample', scope: 'shared', id: 'a--default', shared: true };
  const other: VrtStory = { productId: 'zeta', scope: 'zeta', id: 'a--default', shared: true };

  it('names baselines by scope, story id and theme', () => {
    expect(snapshotName(story, 'dark')).toEqual(['shared', 'a--default-dark.png']);
  });

  it('lists both themes of every story', () => {
    expect(expectedSnapshots([story, other])).toEqual(
      new Set([
        'shared/a--default-light.png',
        'shared/a--default-dark.png',
        'zeta/a--default-light.png',
        'zeta/a--default-dark.png',
      ]),
    );
  });
});

describe('skipReason', () => {
  const shared: VrtStory = { productId: 'sample', scope: 'shared', id: 'a', shared: true };
  const themedElsewhere: VrtStory = { productId: 'zeta', scope: 'zeta', id: 'a', shared: true };
  const own: VrtStory = { productId: 'zeta', scope: 'zeta', id: 'b', shared: false };
  const defaults = parseVrtParameters(undefined);

  it('captures by default', () => {
    expect(skipReason(shared, defaults, 'desktop')).toBeUndefined();
    expect(skipReason(own, defaults, 'mobile')).toBeUndefined();
  });

  it('skips a disabled story and a viewport that is not listed', () => {
    expect(skipReason(shared, { ...defaults, disable: true }, 'desktop')).toContain('disable');
    expect(skipReason(shared, { ...defaults, viewports: ['desktop'] }, 'mobile')).toContain(
      'viewports',
    );
  });

  it('captures a shared story in a non-default product only when it is themed', () => {
    expect(skipReason(themedElsewhere, defaults, 'desktop')).toContain('default product only');
    expect(skipReason(themedElsewhere, { ...defaults, themed: true }, 'desktop')).toBeUndefined();
  });
});

describe('parseVrtParameters', () => {
  it('defaults to capturing every viewport, not disabled and not themed', () => {
    expect(parseVrtParameters(undefined)).toEqual({
      disable: false,
      viewports: VIEWPORTS,
      themed: false,
    });
    expect(parseVrtParameters({})).toEqual({ disable: false, viewports: VIEWPORTS, themed: false });
  });

  it('accepts the documented keys', () => {
    expect(parseVrtParameters({ disable: true, viewports: ['mobile'], themed: true })).toEqual({
      disable: true,
      viewports: ['mobile'],
      themed: true,
    });
  });

  it.each([
    ['not an object', 'x', 'must be an object'],
    ['an array', [], 'must be an object'],
    ['null', null, 'must be an object'],
    ['an unknown key', { disabled: true }, 'Unknown parameters.vrt keys: disabled'],
    ['a non-boolean disable', { disable: 'yes' }, 'disable must be a boolean'],
    ['a non-boolean themed', { themed: 1 }, 'themed must be a boolean'],
    ['an empty viewport list', { viewports: [] }, 'non-empty array'],
    ['an unknown viewport', { viewports: ['tablet'] }, 'non-empty array'],
    ['a non-array viewports', { viewports: 'desktop' }, 'non-empty array'],
  ])('rejects %s', (_label, value, message) => {
    expect(() => parseVrtParameters(value)).toThrow(message);
  });
});
