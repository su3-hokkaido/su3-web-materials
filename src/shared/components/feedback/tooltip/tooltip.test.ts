import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../buttons/button/index.ts';
import './index.ts';
import type { Su3Tooltip } from './tooltip.ts';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function render(markup: string): Promise<Su3Tooltip> {
  document.body.innerHTML = markup;
  const tooltip = document.querySelector('su3-tooltip');
  if (!tooltip) throw new Error('No su3-tooltip was rendered');
  await tooltip.updateComplete;
  await wait(30);
  return tooltip;
}

const surface = (tooltip: Su3Tooltip): HTMLElement => {
  const element = tooltip.shadowRoot?.querySelector<HTMLElement>('[part="surface"]');
  if (!element) throw new Error('No surface');
  return element;
};

const basic = `<su3-tooltip delay="50" style="margin: 200px 300px">
  <button>Save</button>
  <span slot="content">Save changes</span>
</su3-tooltip>`;

afterEach(async () => {
  document.body.innerHTML = '';
  await userEvent.unhover(document.documentElement);
});

describe('su3-tooltip', () => {
  it('is hidden until the pointer rests on the trigger, then shows after the delay', async () => {
    const tooltip = await render(basic);
    await expect.element(page.getByText('Save changes')).not.toBeVisible();
    await page.getByRole('button', { name: 'Save' }).hover();
    expect(tooltip.open).toBe(false);
    await wait(150);
    expect(tooltip.open).toBe(true);
    await expect.element(page.getByText('Save changes')).toBeVisible();
    expect(surface(tooltip).matches(':popover-open')).toBe(true);
  });

  it('hides when the pointer leaves, and never shows for a quick pass', async () => {
    const tooltip = await render(basic.replace('delay="50"', 'delay="300"'));
    await page.getByRole('button', { name: 'Save' }).hover();
    await userEvent.unhover(page.getByRole('button', { name: 'Save' }));
    await wait(450);
    expect(tooltip.open).toBe(false);
    await page.getByRole('button', { name: 'Save' }).hover();
    await wait(400);
    expect(tooltip.open).toBe(true);
    await userEvent.unhover(page.getByRole('button', { name: 'Save' }));
    await wait(300);
    expect(tooltip.open).toBe(false);
  });

  it('stays open while the pointer is over the tooltip itself', async () => {
    const tooltip = await render(basic);
    await page.getByRole('button', { name: 'Save' }).hover();
    await wait(150);
    expect(tooltip.open).toBe(true);
    await page.getByText('Save changes').hover();
    await wait(400);
    expect(tooltip.open).toBe(true);
  });

  it('shows at once on keyboard focus and hides on blur', async () => {
    const tooltip = await render(basic);
    await userEvent.tab();
    await wait(10);
    expect(tooltip.open).toBe(true);
    await userEvent.tab();
    expect(tooltip.open).toBe(false);
  });

  it('shows on keyboard focus of a shadow-based trigger', async () => {
    const tooltip = await render(
      '<su3-tooltip><su3-button>Save</su3-button><span slot="content">Save changes</span></su3-tooltip>',
    );
    await userEvent.tab();
    await wait(10);
    expect(tooltip.open).toBe(true);
  });

  it('closes on Escape', async () => {
    const tooltip = await render(basic);
    await userEvent.tab();
    await wait(10);
    expect(tooltip.open).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(tooltip.open).toBe(false);
  });

  it('closes on Escape when it was opened by hover, with no focus on the trigger', async () => {
    const tooltip = await render(basic);
    await page.getByRole('button', { name: 'Save' }).hover();
    await wait(150);
    expect(tooltip.open).toBe(true);
    await userEvent.keyboard('{Escape}');
    expect(tooltip.open).toBe(false);
  });

  it('stays open when the tooltip itself is pressed', async () => {
    const tooltip = await render(basic);
    await page.getByRole('button', { name: 'Save' }).hover();
    await wait(150);
    await page.getByText('Save changes').click();
    expect(tooltip.open).toBe(true);
  });

  it('closes when the trigger is pressed and does not come back from the press focus', async () => {
    const tooltip = await render(basic);
    await page.getByRole('button', { name: 'Save' }).hover();
    await wait(150);
    expect(tooltip.open).toBe(true);
    await page.getByRole('button', { name: 'Save' }).click();
    await wait(150);
    expect(tooltip.open).toBe(false);
  });

  it('shows from code with open and is suppressed by disabled', async () => {
    const tooltip = await render(basic);
    tooltip.open = true;
    await tooltip.updateComplete;
    expect(surface(tooltip).matches(':popover-open')).toBe(true);
    tooltip.disabled = true;
    await tooltip.updateComplete;
    expect(surface(tooltip).matches(':popover-open')).toBe(false);
    tooltip.open = false;
    await page.getByRole('button', { name: 'Save' }).hover();
    await wait(150);
    expect(tooltip.open).toBe(false);
  });

  it('cancels a pending show when disabled is set, and does not open by focus while disabled', async () => {
    const tooltip = await render(basic.replace('delay="50"', 'delay="200"'));
    await page.getByRole('button', { name: 'Save' }).hover();
    tooltip.disabled = true;
    await wait(350);
    expect(tooltip.open).toBe(false);
    await userEvent.tab();
    await wait(30);
    expect(tooltip.open).toBe(false);
  });

  it('reads delay from the attribute and reflects placement', async () => {
    const tooltip = await render(basic.replace('delay="50"', 'delay="120" placement="bottom"'));
    expect(tooltip.delay).toBe(120);
    expect(tooltip.getAttribute('placement')).toBe('bottom');
  });

  it('does not open for touch', async () => {
    const tooltip = await render(basic);
    tooltip.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
    await wait(150);
    expect(tooltip.open).toBe(false);
  });

  it('removes its aria-describedby id when the content element is replaced', async () => {
    const tooltip = await render(basic);
    const first = document.querySelector('[slot="content"]');
    const oldId = first?.id ?? '';
    first?.remove();
    const next = document.createElement('span');
    next.slot = 'content';
    next.textContent = 'Other';
    tooltip.append(next);
    await wait(30);
    const ids = (document.querySelector('button')?.getAttribute('aria-describedby') ?? '').split(
      ' ',
    );
    expect(ids).not.toContain(oldId);
    expect(ids).toContain(next.id);
  });

  it('describes the trigger with the content element', async () => {
    await render(basic);
    const content = document.querySelector('[slot="content"]');
    expect(content?.id).not.toBe('');
    await expect
      .element(page.getByRole('button', { name: 'Save' }))
      .toHaveAccessibleDescription('Save changes');
  });

  it('keeps an existing aria-describedby of the trigger', async () => {
    await render(
      '<p id="hint">Hint</p><su3-tooltip><button aria-describedby="hint">Save</button><span slot="content">Tip</span></su3-tooltip>',
    );
    const ids = document.querySelector('button')?.getAttribute('aria-describedby') ?? '';
    expect(ids.split(' ')).toContain('hint');
    expect(ids.split(' ')).toHaveLength(2);
  });

  it('has the tooltip role', async () => {
    const tooltip = await render(basic);
    tooltip.open = true;
    await tooltip.updateComplete;
    await expect.element(page.getByRole('tooltip')).toBeVisible();
  });
});

describe('placement', () => {
  const open = (attributes: string, style = 'margin: 200px 150px'): string =>
    `<su3-tooltip open ${attributes} style="${style}"><button>Save</button><span slot="content">Save changes</span></su3-tooltip>`;

  const boxes = (tooltip: Su3Tooltip): { trigger: DOMRect; tip: DOMRect } => {
    const trigger = tooltip.querySelector('button')?.getBoundingClientRect();
    if (!trigger) throw new Error('No trigger');
    return { trigger, tip: surface(tooltip).getBoundingClientRect() };
  };

  it('puts the tooltip above, centered on the trigger, by default', async () => {
    const { trigger, tip } = boxes(await render(open('')));
    expect(tip.bottom).toBeLessThanOrEqual(trigger.top);
    expect(Math.abs(tip.left + tip.width / 2 - (trigger.left + trigger.width / 2))).toBeLessThan(2);
  });

  it('puts the tooltip below, at the start or at the end', async () => {
    let { trigger, tip } = boxes(await render(open('placement="bottom"')));
    expect(tip.top).toBeGreaterThanOrEqual(trigger.bottom);
    ({ trigger, tip } = boxes(await render(open('placement="start"'))));
    expect(tip.right).toBeLessThanOrEqual(trigger.left);
    ({ trigger, tip } = boxes(await render(open('placement="end"'))));
    expect(tip.left).toBeGreaterThanOrEqual(trigger.right);
  });

  it('follows the text direction for start and end', async () => {
    document.documentElement.dir = 'rtl';
    try {
      const { trigger, tip } = boxes(await render(open('placement="start"')));
      expect(tip.left).toBeGreaterThanOrEqual(trigger.right);
    } finally {
      document.documentElement.removeAttribute('dir');
    }
  });

  it('flips to the opposite side when it does not fit', async () => {
    const { trigger, tip } = boxes(await render(open('', 'margin: 0 150px')));
    expect(tip.top).toBeGreaterThanOrEqual(trigger.bottom);
  });

  it('stays inside the viewport at the edge', async () => {
    const { tip } = boxes(await render(open('', 'margin: 200px 0')));
    expect(tip.left).toBeGreaterThanOrEqual(0);
    const far = boxes(await render(open('', 'margin: 200px 0 0 calc(100vw - 40px)')));
    expect(far.tip.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
  });

  it('follows the offset hook', async () => {
    const { trigger, tip } = boxes(
      await render(open('', 'margin: 200px 150px; --su3-comp-tooltip-offset: 20px')),
    );
    expect(Math.round(trigger.top - tip.bottom)).toBe(20);
  });
});

describe('appearance (built-in light values)', () => {
  it('uses the inverse of the page and follows the container hook', async () => {
    const tooltip = await render(
      '<su3-tooltip open style="margin: 200px 300px"><button>Save</button><span slot="content">Tip</span></su3-tooltip>',
    );
    expect(getComputedStyle(surface(tooltip)).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    tooltip.style.setProperty('--su3-comp-tooltip-container-color', 'rgb(1, 2, 3)');
    await tooltip.updateComplete;
    expect(getComputedStyle(surface(tooltip)).backgroundColor).toBe('rgb(1, 2, 3)');
  });
});
