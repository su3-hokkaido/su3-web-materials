import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { tokensCss } from '../../../tokens/index.ts';
import './index.ts';
import type { Su3Button } from './button.ts';

/** Renders markup and waits for every button in it to finish rendering. */
async function render(markup: string): Promise<Su3Button> {
  document.body.innerHTML = markup;
  const buttons = [...document.querySelectorAll('su3-button')];
  await Promise.all(buttons.map((button) => button.updateComplete));
  const first = buttons[0];
  if (!first) throw new Error('No su3-button was rendered');
  return first;
}

/** The interactive element inside the shadow root, addressed by its documented part name. */
function control(host: Su3Button): HTMLElement {
  const element = host.shadowRoot?.querySelector<HTMLElement>('[part="button"]');
  if (!element) throw new Error('The button part was not rendered');
  return element;
}

const style = (host: Su3Button) => getComputedStyle(control(host));

/**
 * Clicks an element that is `aria-disabled`. Playwright treats that as "not enabled" and would wait
 * forever, so the click is forced: it still goes through the real pointer path.
 */
const forceClick = (locator: ReturnType<typeof page.getByRole>) =>
  userEvent.click(locator, { force: true });

/** Lets deferred form actions (a macrotask) run. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

/** Counts the click events that reach a listener on the host. */
function countClicks(host: Su3Button): () => number {
  let clicks = 0;
  host.addEventListener('click', () => {
    clicks += 1;
  });
  return () => clicks;
}

afterEach(() => {
  document.body.innerHTML = '';
  document.head.querySelectorAll('style[data-test]').forEach((node) => {
    node.remove();
  });
  document.documentElement.removeAttribute('data-theme');
  window.location.hash = '';
});

describe('defaults and reflection', () => {
  it('starts as a medium filled button that submits', async () => {
    const host = await render('<su3-button>Save</su3-button>');
    expect(host.variant).toBe('filled');
    expect(host.size).toBe('md');
    expect(host.type).toBe('submit');
    expect(host.disabled).toBe(false);
    expect(host.softDisabled).toBe(false);
    expect(host.getAttribute('variant')).toBe('filled');
    expect(host.getAttribute('size')).toBe('md');
  });

  it('reflects property changes to attributes', async () => {
    const host = await render('<su3-button>Save</su3-button>');
    host.variant = 'tonal';
    host.size = 'lg';
    host.softDisabled = true;
    host.disabled = true;
    await host.updateComplete;
    expect(host.getAttribute('variant')).toBe('tonal');
    expect(host.getAttribute('size')).toBe('lg');
    expect(host.hasAttribute('soft-disabled')).toBe(true);
    expect(host.hasAttribute('disabled')).toBe(true);
  });

  it('reads the soft-disabled attribute into softDisabled', async () => {
    const host = await render('<su3-button soft-disabled>Save</su3-button>');
    expect(host.softDisabled).toBe(true);
  });
});

describe('rendering', () => {
  it('exposes a button named by its label', async () => {
    await render('<su3-button>Save</su3-button>');
    await expect.element(page.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  it('renders leading and trailing slots around the label', async () => {
    const host = await render(
      '<su3-button><span slot="leading">L</span>Label<span slot="trailing">T</span></su3-button>',
    );
    const slots = [...(host.shadowRoot?.querySelectorAll('slot') ?? [])];
    expect(slots.map((slot) => slot.name)).toEqual(['leading', '', 'trailing']);
    expect(slots[0]?.assignedElements().map((node) => node.textContent)).toEqual(['L']);
    expect(slots[2]?.assignedElements().map((node) => node.textContent)).toEqual(['T']);
  });

  it('exposes the button and label parts to outside styles', async () => {
    const host = await render('<su3-button>Save</su3-button>');
    document.head.insertAdjacentHTML(
      'beforeend',
      '<style data-test>su3-button::part(button) { letter-spacing: 5px; } su3-button::part(label) { text-transform: uppercase; }</style>',
    );
    expect(style(host).letterSpacing).toBe('5px');
    const label = host.shadowRoot?.querySelector('[part="label"]');
    expect(label && getComputedStyle(label).textTransform).toBe('uppercase');
  });

  it('delegates aria-label to the inner button and follows changes', async () => {
    const host = await render(
      '<su3-button aria-label="Add item"><svg slot="leading" width="20" height="20" aria-hidden="true"></svg></su3-button>',
    );
    await expect.element(page.getByRole('button', { name: 'Add item' })).toBeVisible();

    host.setAttribute('aria-label', 'Add another');
    await host.updateComplete;
    await expect.element(page.getByRole('button', { name: 'Add another' })).toBeVisible();
  });
});

describe('icon-only', () => {
  const iconOnly =
    '<su3-button aria-label="Add"><svg slot="leading" width="20" height="20" aria-hidden="true"></svg></su3-button>';

  it('is square with the icon centered, because there is no label to add a gap', async () => {
    const host = await render(iconOnly);
    const control = style(host);
    expect(control.width).toBe(control.height);
    const box = host.shadowRoot?.querySelector('[part="button"]')?.getBoundingClientRect();
    const icon = host.querySelector('svg')?.getBoundingClientRect();
    expect((icon?.left ?? 0) + (icon?.width ?? 0) / 2).toBeCloseTo(
      (box?.left ?? 0) + (box?.width ?? 0) / 2,
      0,
    );
  });

  it('hides the label wrapper only when there is no label content', async () => {
    const withoutLabel = await render(iconOnly);
    expect(
      getComputedStyle(withoutLabel.shadowRoot?.querySelector('[part="label"]') as Element).display,
    ).toBe('none');

    const withLabel = await render(
      '<su3-button><svg slot="leading" width="20" height="20"></svg>Save</su3-button>',
    );
    expect(
      getComputedStyle(withLabel.shadowRoot?.querySelector('[part="label"]') as Element).display,
    ).not.toBe('none');
  });

  it('shows the label as soon as content is added', async () => {
    const host = await render(iconOnly);
    host.append('Add');
    await new Promise((resolve) => setTimeout(resolve, 50));
    await host.updateComplete;
    expect(host.hasLabel).toBe(true);
    expect(style(host).width).not.toBe(style(host).height);
  });
});

describe('variants (built-in light values)', () => {
  const cases = [
    ['filled', 'rgb(0, 96, 113)', 'rgb(228, 250, 255)'],
    ['tonal', 'rgb(200, 244, 255)', 'rgb(0, 72, 86)'],
    ['elevated', 'rgb(255, 255, 255)', 'rgb(0, 96, 113)'],
    ['outlined', 'rgba(0, 0, 0, 0)', 'rgb(0, 96, 113)'],
    ['text', 'rgba(0, 0, 0, 0)', 'rgb(0, 96, 113)'],
  ] as const;

  for (const [variant, background, color] of cases) {
    it(`${variant} uses its container and label colors`, async () => {
      const host = await render(`<su3-button variant="${variant}">Go</su3-button>`);
      expect(style(host).backgroundColor).toBe(background);
      expect(style(host).color).toBe(color);
    });
  }

  it('gives only the elevated variant a shadow', async () => {
    for (const variant of ['filled', 'tonal', 'outlined', 'text']) {
      const host = await render(`<su3-button variant="${variant}">Go</su3-button>`);
      expect(style(host).boxShadow, variant).toBe('none');
    }
    const elevated = await render('<su3-button variant="elevated">Go</su3-button>');
    expect(style(elevated).boxShadow).not.toBe('none');
  });

  it('draws a visible border only for the outlined variant', async () => {
    const outlined = await render('<su3-button variant="outlined">Go</su3-button>');
    expect(style(outlined).borderTopColor).toBe('rgb(128, 135, 140)');
    const filled = await render('<su3-button variant="filled">Go</su3-button>');
    expect(style(filled).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('falls back to the filled look for an unknown variant', async () => {
    const host = await render('<su3-button variant="nope">Go</su3-button>');
    expect(style(host).backgroundColor).toBe('rgb(0, 96, 113)');
  });
});

describe('sizes', () => {
  for (const [size, height] of [
    ['sm', '32px'],
    ['md', '40px'],
    ['lg', '48px'],
  ] as const) {
    it(`${size} is ${height} tall`, async () => {
      const host = await render(`<su3-button size="${size}">Go</su3-button>`);
      expect(style(host).height).toBe(height);
    });
  }
});

describe('state feedback', () => {
  /** Opacity of the state layer, which paints the label color over the container. */
  const stateLayerOpacity = (host: Su3Button): number =>
    Number(getComputedStyle(control(host), '::before').opacity);

  for (const variant of ['filled', 'tonal', 'elevated', 'outlined', 'text']) {
    it(`${variant} shows a state layer on hover`, async () => {
      const host = await render(`<su3-button variant="${variant}">Go</su3-button>`);
      expect(stateLayerOpacity(host)).toBe(0);
      await userEvent.hover(page.getByRole('button', { name: 'Go' }));
      await expect.poll(() => stateLayerOpacity(host)).toBeCloseTo(0.08, 2);
    });
  }

  it('still reacts to hover when the container color is overridden', async () => {
    const host = await render(
      '<su3-button style="--su3-comp-button-container-color: rgb(10, 20, 30)">Go</su3-button>',
    );
    expect(style(host).backgroundColor).toBe('rgb(10, 20, 30)');
    await userEvent.hover(page.getByRole('button', { name: 'Go' }));
    await expect.poll(() => stateLayerOpacity(host)).toBeCloseTo(0.08, 2);
    expect(style(host).backgroundColor).toBe('rgb(10, 20, 30)');
  });

  it('does not react while disabled or soft-disabled', async () => {
    const host = await render('<su3-button soft-disabled>Go</su3-button>');
    await userEvent.hover(page.getByRole('button', { name: 'Go' }), { force: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(stateLayerOpacity(host)).toBe(0);
  });
});

describe('theming', () => {
  it('lets a component token override the default', async () => {
    const host = await render(
      '<su3-button style="--su3-comp-button-container-shape: 9999px; --su3-comp-button-height: 56px">Go</su3-button>',
    );
    expect(style(host).borderTopLeftRadius).toBe('9999px');
    expect(style(host).height).toBe('56px');
  });

  it('follows a system token override', async () => {
    const host = await render(
      '<su3-button style="--su3-sys-color-accent: rgb(1, 2, 3)">Go</su3-button>',
    );
    expect(style(host).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('uses the dark palette from the token stylesheet', async () => {
    document.head.insertAdjacentHTML('beforeend', `<style data-test>${tokensCss}</style>`);
    document.documentElement.dataset['theme'] = 'dark';
    const host = await render('<su3-button>Go</su3-button>');
    expect(style(host).backgroundColor).toBe('rgb(84, 208, 236)');
    expect(style(host).color).toBe('rgb(7, 12, 16)');
  });
});

describe('interaction', () => {
  it('fires click events on pointer activation', async () => {
    const host = await render('<su3-button>Go</su3-button>');
    const clicks = countClicks(host);
    await userEvent.click(page.getByRole('button', { name: 'Go' }));
    expect(clicks()).toBe(1);
  });

  it('activates with Enter and Space from the keyboard', async () => {
    const host = await render('<su3-button>Go</su3-button>');
    const clicks = countClicks(host);
    await userEvent.tab();
    expect(host.matches(':focus')).toBe(true);
    await userEvent.keyboard('{Enter}');
    expect(clicks()).toBe(1);
    await userEvent.keyboard(' ');
    expect(clicks()).toBe(2);
  });

  it('shows a focus ring for keyboard focus', async () => {
    const host = await render('<su3-button>Go</su3-button>');
    expect(style(host).outlineStyle).toBe('none');
    await userEvent.tab();
    expect(style(host).outlineStyle).toBe('solid');
    expect(style(host).outlineWidth).toBe('2px');
    expect(style(host).outlineColor).toBe('rgb(0, 150, 175)');
  });

  it('moves focus to the inner button on host.focus()', async () => {
    const host = await render('<su3-button>Go</su3-button>');
    host.focus();
    expect(host.shadowRoot?.activeElement).toBe(control(host));
  });
});

describe('disabled', () => {
  it('disables the inner button and takes it out of the tab order', async () => {
    const host = await render('<su3-button disabled>Go</su3-button><button>After</button>');
    await expect.element(page.getByRole('button', { name: 'Go' })).toBeDisabled();
    await userEvent.tab();
    expect(host.matches(':focus')).toBe(false);
    expect(document.activeElement?.textContent).toBe('After');
  });

  it('is disabled by a disabled fieldset', async () => {
    await render('<fieldset disabled><su3-button>Go</su3-button></fieldset>');
    await expect.element(page.getByRole('button', { name: 'Go' })).toBeDisabled();
  });

  it('does not deliver clicks', async () => {
    const host = await render('<su3-button disabled>Go</su3-button>');
    const clicks = countClicks(host);
    control(host).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    expect(clicks()).toBe(0);
  });

  it('looks disabled: muted label and no shadow', async () => {
    const enabled = await render('<su3-button variant="elevated">Go</su3-button>');
    const enabledColor = style(enabled).color;
    const disabled = await render('<su3-button variant="elevated" disabled>Go</su3-button>');
    expect(style(disabled).color).not.toBe(enabledColor);
    expect(style(disabled).boxShadow).toBe('none');
  });
});

describe('soft-disabled', () => {
  it('stays focusable and announces aria-disabled', async () => {
    const host = await render('<su3-button soft-disabled>Go</su3-button>');
    const button = page.getByRole('button', { name: 'Go' });
    // Not natively disabled (that would remove it from the tab order), only aria-disabled.
    expect(control(host).hasAttribute('disabled')).toBe(false);
    await expect.element(button).toHaveAttribute('aria-disabled', 'true');
    await userEvent.tab();
    expect(host.matches(':focus')).toBe(true);
  });

  it('keeps the focus ring visible', async () => {
    const host = await render('<su3-button soft-disabled>Go</su3-button>');
    await userEvent.tab();
    expect(style(host).outlineStyle).toBe('solid');
  });

  it('swallows pointer and keyboard activation', async () => {
    const host = await render('<su3-button soft-disabled>Go</su3-button>');
    const clicks = countClicks(host);
    await forceClick(page.getByRole('button', { name: 'Go' }));
    await userEvent.keyboard('{Enter}');
    expect(clicks()).toBe(0);
  });

  it('looks the same as disabled', async () => {
    const hard = await render('<su3-button disabled>Go</su3-button>');
    const hardLook = [style(hard).color, style(hard).backgroundColor, style(hard).boxShadow];
    const soft = await render('<su3-button soft-disabled>Go</su3-button>');
    expect([style(soft).color, style(soft).backgroundColor, style(soft).boxShadow]).toEqual(
      hardLook,
    );
  });
});

describe('link mode', () => {
  it('renders an anchor with the link attributes', async () => {
    await render(
      '<su3-button href="https://example.com/file" target="_blank" rel="noreferrer" download="f.txt">Open</su3-button>',
    );
    const link = page.getByRole('link', { name: 'Open' });
    await expect.element(link).toHaveAttribute('href', 'https://example.com/file');
    await expect.element(link).toHaveAttribute('target', '_blank');
    await expect.element(link).toHaveAttribute('rel', 'noreferrer');
    await expect.element(link).toHaveAttribute('download', 'f.txt');
  });

  it('navigates when activated', async () => {
    await render('<su3-button href="#clicked">Go</su3-button>');
    await userEvent.click(page.getByRole('link', { name: 'Go' }));
    expect(window.location.hash).toBe('#clicked');
  });

  it('removes the href but keeps link semantics when disabled', async () => {
    await render('<su3-button href="#clicked" disabled>Go</su3-button>');
    const link = page.getByRole('link', { name: 'Go' });
    await expect.element(link).not.toHaveAttribute('href');
    await expect.element(link).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not navigate when soft-disabled', async () => {
    const host = await render('<su3-button href="#clicked" soft-disabled>Go</su3-button>');
    const clicks = countClicks(host);
    await forceClick(page.getByRole('link', { name: 'Go' }));
    expect(window.location.hash).toBe('');
    expect(clicks()).toBe(0);
  });

  it('keeps a soft-disabled link reachable by keyboard', async () => {
    const host = await render('<su3-button href="#clicked" soft-disabled>Go</su3-button>');
    await userEvent.tab();
    expect(host.matches(':focus')).toBe(true);
  });

  it('leaves a hard-disabled link out of the tab order', async () => {
    const host = await render('<su3-button href="#clicked" disabled>Go</su3-button>');
    await userEvent.tab();
    expect(host.matches(':focus')).toBe(false);
  });

  it('does not submit the form it sits in', async () => {
    document.body.innerHTML = '<form><su3-button href="#clicked">Go</su3-button></form>';
    const form = document.querySelector('form');
    let submitted = 0;
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted += 1;
    });
    await userEvent.click(page.getByRole('link', { name: 'Go' }));
    await settle();
    expect(submitted).toBe(0);
  });
});

describe('inside a form', () => {
  async function renderForm(buttonMarkup: string) {
    document.body.innerHTML = `<form><input name="field" value="initial" />${buttonMarkup}</form>`;
    const host = document.querySelector('su3-button');
    const form = document.querySelector('form');
    const input = document.querySelector('input');
    if (!host || !form || !input) throw new Error('Fixture was not rendered');
    await host.updateComplete;
    const submissions: FormData[] = [];
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submissions.push(new FormData(form));
    });
    return { host, form, input, submissions };
  }

  it('submits by default and sends its name and value', async () => {
    const { submissions } = await renderForm(
      '<su3-button name="intent" value="save">Go</su3-button>',
    );
    await userEvent.click(page.getByRole('button', { name: 'Go' }));
    await expect.poll(() => submissions.length).toBe(1);
    expect(submissions[0]?.get('intent')).toBe('save');
    expect(submissions[0]?.get('field')).toBe('initial');
  });

  it('submits from the keyboard', async () => {
    const { submissions } = await renderForm('<su3-button>Go</su3-button>');
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => submissions.length).toBe(1);
  });

  it('resets the form for type reset', async () => {
    const { input } = await renderForm('<su3-button type="reset">Reset</su3-button>');
    input.value = 'changed';
    await userEvent.click(page.getByRole('button', { name: 'Reset' }));
    await expect.poll(() => input.value).toBe('initial');
  });

  it('treats an unknown type as submit, like <button>', async () => {
    const { submissions } = await renderForm('<su3-button type="bogus">Go</su3-button>');
    await userEvent.click(page.getByRole('button', { name: 'Go' }));
    await expect.poll(() => submissions.length).toBe(1);
  });

  it('does nothing for type button', async () => {
    const { submissions } = await renderForm('<su3-button type="button">Go</su3-button>');
    await userEvent.click(page.getByRole('button', { name: 'Go' }));
    await settle();
    expect(submissions).toHaveLength(0);
  });

  it('does not submit when soft-disabled', async () => {
    const { submissions } = await renderForm('<su3-button soft-disabled>Go</su3-button>');
    await forceClick(page.getByRole('button', { name: 'Go' }));
    await settle();
    expect(submissions).toHaveLength(0);
  });

  it('does not submit when a click listener prevents the default', async () => {
    const { host, submissions } = await renderForm('<su3-button>Go</su3-button>');
    host.addEventListener('click', (event) => {
      event.preventDefault();
    });
    await userEvent.click(page.getByRole('button', { name: 'Go' }));
    await settle();
    expect(submissions).toHaveLength(0);
  });
});
