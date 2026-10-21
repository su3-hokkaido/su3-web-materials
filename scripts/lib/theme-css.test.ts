import { describe, expect, it } from 'vitest';
import { declaredProperties, parseRules, themeColorOverrides } from './theme-css.ts';

const css = `
/* comment with { braces } and ; semicolons */
:root,
[data-theme='light'] {
  --su3-sys-color-accent: #112233;
  --su3-sys-typeface-sans: ui-rounded, 'A; B', system-ui;
}

[data-theme='dark'] {
  --su3-sys-color-accent: #aabbcc;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --su3-sys-color-accent: #aabbcc;
  }
}
`;

describe('parseRules', () => {
  it('returns plain rules and rules inside an at-rule', () => {
    const rules = parseRules(css);
    expect(rules.map((rule) => [rule.selector, rule.atRule])).toEqual([
      [":root, [data-theme='light']", undefined],
      ["[data-theme='dark']", undefined],
      [':root:not([data-theme])', '@media (prefers-color-scheme: dark)'],
    ]);
  });

  it('ignores comments and keeps values with commas and quotes', () => {
    const [first] = parseRules(css);
    expect(first?.declarations['--su3-sys-color-accent']).toBe('#112233');
    expect(first?.declarations['--su3-sys-typeface-sans']).toContain("'A");
  });

  it('skips declarations without a colon and text without a block', () => {
    const [rule] = parseRules('a { color red; --x: 1 } trailing text');
    expect(rule?.declarations).toEqual({ '--x': '1' });
    expect(parseRules('only text')).toEqual([]);
  });

  it('returns nothing for a stylesheet with only a comment', () => {
    expect(parseRules('/* nothing */')).toEqual([]);
  });
});

describe('themeColorOverrides', () => {
  it('splits colors into light, dark and OS-preference dark', () => {
    expect(themeColorOverrides(css)).toEqual({
      light: { accent: '#112233' },
      dark: { accent: '#aabbcc' },
      darkPreference: { accent: '#aabbcc' },
    });
  });

  it('treats a plain :root rule as light and ignores other selectors and at-rules', () => {
    const other = `
      :root { --su3-sys-color-accent: #111111; }
      .unrelated { --su3-sys-color-accent: #222222; }
      @media (min-width: 600px) { :root { --su3-sys-color-accent: #333333; } }
      @media (prefers-color-scheme: dark) { .unrelated { --su3-sys-color-accent: #444444; } }
    `;
    expect(themeColorOverrides(other)).toEqual({
      light: { accent: '#111111' },
      dark: {},
      darkPreference: {},
    });
  });

  it('is empty for a theme without overrides', () => {
    expect(themeColorOverrides('/* none */')).toEqual({ light: {}, dark: {}, darkPreference: {} });
  });
});

describe('declaredProperties', () => {
  it('lists each custom property once, sorted', () => {
    expect(declaredProperties(css)).toEqual(['--su3-sys-color-accent', '--su3-sys-typeface-sans']);
  });
});
