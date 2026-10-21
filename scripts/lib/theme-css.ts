/**
 * A small reader for product theme stylesheets (`src/products/{id}/theme.css`), which only contain
 * custom property declarations in plain rules and one level of `@media`. It exists so a test can
 * check a theme's colors without a CSS engine; it is not a general CSS parser.
 */

export interface CssRule {
  /** The selector list, whitespace-collapsed. */
  selector: string;
  /** The enclosing at-rule prelude, e.g. `@media (prefers-color-scheme: dark)`. */
  atRule?: string;
  declarations: Record<string, string>;
}

function parseDeclarations(body: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  for (const part of body.split(';')) {
    const colon = part.indexOf(':');
    if (colon === -1) continue;
    declarations[part.slice(0, colon).trim()] = part.slice(colon + 1).trim();
  }
  return declarations;
}

function parseBlock(text: string, atRule?: string): CssRule[] {
  const rules: CssRule[] = [];
  let index = 0;
  while (index < text.length) {
    const open = text.indexOf('{', index);
    if (open === -1) break;
    let depth = 1;
    let close = open + 1;
    while (close < text.length && depth > 0) {
      if (text[close] === '{') depth += 1;
      else if (text[close] === '}') depth -= 1;
      close += 1;
    }
    const header = text.slice(index, open).replace(/\s+/g, ' ').trim();
    const body = text.slice(open + 1, close - 1);
    if (header.startsWith('@')) {
      rules.push(...parseBlock(body, header));
    } else {
      rules.push({
        selector: header,
        ...(atRule === undefined ? {} : { atRule }),
        declarations: parseDeclarations(body),
      });
    }
    index = close;
  }
  return rules;
}

/** Parses the rules of a stylesheet, comments removed. */
export function parseRules(css: string): CssRule[] {
  return parseBlock(css.replace(/\/\*[\s\S]*?\*\//g, ''));
}

/** Color role overrides (`--su3-sys-color-{role}` -> value) of a theme, by where they apply. */
export interface ThemeColorOverrides {
  light: Record<string, string>;
  dark: Record<string, string>;
  /** Declared for the OS preference when no `data-theme` is set on the root. */
  darkPreference: Record<string, string>;
}

const COLOR_PREFIX = '--su3-sys-color-';

function colorRoles(declarations: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(declarations)
      .filter(([name]) => name.startsWith(COLOR_PREFIX))
      .map(([name, value]) => [name.slice(COLOR_PREFIX.length), value]),
  );
}

/** Splits a theme's color overrides into light, dark and OS-preference dark, as tokens.css does. */
export function themeColorOverrides(css: string): ThemeColorOverrides {
  const result: ThemeColorOverrides = { light: {}, dark: {}, darkPreference: {} };
  for (const rule of parseRules(css)) {
    const selectors = rule.selector.split(',').map((selector) => selector.trim());
    const colors = colorRoles(rule.declarations);
    if (rule.atRule === '@media (prefers-color-scheme: dark)') {
      if (selectors.includes(':root:not([data-theme])'))
        Object.assign(result.darkPreference, colors);
    } else if (rule.atRule === undefined) {
      if (selectors.includes("[data-theme='dark']")) Object.assign(result.dark, colors);
      else if (selectors.includes(':root') || selectors.includes("[data-theme='light']")) {
        Object.assign(result.light, colors);
      }
    }
  }
  return result;
}

/** Every custom property a theme declares, whatever the rule. */
export function declaredProperties(css: string): string[] {
  return [
    ...new Set(
      parseRules(css).flatMap((rule) =>
        Object.keys(rule.declarations).filter((name) => name.startsWith('--')),
      ),
    ),
  ].sort();
}
