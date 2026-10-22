import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import '../../buttons/icon-button/index.ts';
import './index.ts';
import type { Su3TopAppBar } from './top-app-bar.ts';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function render(markup: string): Promise<Su3TopAppBar> {
  document.body.innerHTML = markup;
  const bar = document.querySelector('su3-top-app-bar');
  if (!bar) throw new Error('No su3-top-app-bar was rendered');
  await bar.updateComplete;
  return bar;
}

const part = (bar: Su3TopAppBar, name: string): HTMLElement => {
  const element = bar.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`);
  if (!element) throw new Error(`No ${name}`);
  return element;
};

const basic = (attributes = ''): string => `<su3-top-app-bar ${attributes}>
  <su3-icon-button slot="navigation" aria-label="Menu">M</su3-icon-button>
  <h1>Inbox</h1>
  <su3-icon-button slot="actions" aria-label="Search">S</su3-icon-button>
  <su3-icon-button slot="actions" aria-label="More">O</su3-icon-button>
</su3-top-app-bar>`;

// A tall page so the window can scroll.
const tall = (attributes: string): string =>
  `${basic(attributes)}<div style="block-size: 3000px"></div>`;

afterEach(() => {
  document.body.innerHTML = '';
  window.scrollTo(0, 0);
});

describe('su3-top-app-bar', () => {
  it('is the banner landmark with the title as a heading', async () => {
    await render(basic());
    await expect.element(page.getByRole('banner')).toBeVisible();
    await expect.element(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
  });

  it('lays out the navigation, the title and the actions in order', async () => {
    const bar = await render(basic());
    const menu = page.getByRole('button', { name: 'Menu' }).element().getBoundingClientRect();
    const title = page.getByRole('heading').element().getBoundingClientRect();
    const search = page.getByRole('button', { name: 'Search' }).element().getBoundingClientRect();
    const more = page.getByRole('button', { name: 'More' }).element().getBoundingClientRect();
    expect(menu.right).toBeLessThanOrEqual(title.left);
    expect(title.right).toBeLessThanOrEqual(search.left);
    expect(search.right).toBeLessThanOrEqual(more.left);
    expect(Math.abs(more.right - bar.getBoundingClientRect().right)).toBeLessThan(12);
  });

  it('centers the title in the center variant', async () => {
    const bar = await render(basic('variant="center"'));
    const title = page.getByRole('heading').element().getBoundingClientRect();
    const box = bar.getBoundingClientRect();
    expect(Math.abs(title.left + title.width / 2 - (box.left + box.width / 2))).toBeLessThan(3);
  });

  it('puts a larger title on a second row in the large variant', async () => {
    const small = await render(basic());
    const smallHeight = small.getBoundingClientRect().height;
    const smallTitle = parseFloat(getComputedStyle(page.getByRole('heading').element()).fontSize);
    const large = await render(basic('variant="large"'));
    const controls = page.getByRole('button', { name: 'Menu' }).element().getBoundingClientRect();
    const title = page.getByRole('heading').element().getBoundingClientRect();
    expect(title.top).toBeGreaterThanOrEqual(controls.bottom);
    expect(large.getBoundingClientRect().height).toBeGreaterThan(smallHeight);
    expect(
      parseFloat(getComputedStyle(page.getByRole('heading').element()).fontSize),
    ).toBeGreaterThan(smallTitle);
  });

  it('shows plain text as the title and ignores empty slots', async () => {
    await render('<su3-top-app-bar>Settings</su3-top-app-bar>');
    await expect.element(page.getByText('Settings')).toBeVisible();
  });

  it('keeps a long title on one line with an ellipsis in the small variant', async () => {
    const bar = await render(
      '<su3-top-app-bar style="inline-size: 240px"><h1>A very long title that cannot possibly fit in this width</h1></su3-top-app-bar>',
    );
    const heading = bar.querySelector('h1');
    if (!heading) throw new Error('No heading');
    expect(getComputedStyle(heading).textOverflow).toBe('ellipsis');
    expect(heading.scrollWidth).toBeGreaterThan(heading.clientWidth);
  });

  it('keeps the actions visible next to a long title in the center variant', async () => {
    const bar = await render(
      '<su3-top-app-bar variant="center" style="inline-size: 280px"><su3-icon-button slot="navigation" aria-label="Menu">M</su3-icon-button><h1>A very long title that cannot possibly fit in this width</h1><su3-icon-button slot="actions" aria-label="More">O</su3-icon-button></su3-top-app-bar>',
    );
    const more = page.getByRole('button', { name: 'More' }).element().getBoundingClientRect();
    const box = bar.getBoundingClientRect();
    expect(more.right).toBeLessThanOrEqual(box.right + 1);
    expect(more.width).toBeGreaterThan(20);
  });

  it('wraps a long title in the large variant', async () => {
    const bar = await render(
      '<su3-top-app-bar variant="large" style="inline-size: 240px"><h1>A very long title that cannot possibly fit in this width</h1></su3-top-app-bar>',
    );
    const heading = bar.querySelector('h1');
    if (!heading) throw new Error('No heading');
    expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth + 1);
    expect(heading.getBoundingClientRect().height).toBeGreaterThan(40);
  });

  it('reflects variant and has the small variant by default', async () => {
    const bar = await render(basic());
    expect(bar.variant).toBe('small');
    expect(bar.getAttribute('variant')).toBe('small');
  });
});

describe('sticky and scroll elevation', () => {
  it('stays at the top of the viewport while the page scrolls when sticky', async () => {
    const bar = await render(tall('sticky'));
    window.scrollTo(0, 400);
    await wait(50);
    expect(Math.round(bar.getBoundingClientRect().top)).toBe(0);
  });

  it('scrolls away when not sticky', async () => {
    const bar = await render(tall(''));
    window.scrollTo(0, 400);
    await wait(50);
    expect(bar.getBoundingClientRect().bottom).toBeLessThan(0);
  });

  it('is raised only while scrolled, with elevate-on-scroll', async () => {
    const bar = await render(tall('sticky elevate-on-scroll'));
    expect(bar.scrolled).toBe(false);
    expect(getComputedStyle(part(bar, 'bar')).boxShadow).toBe('none');
    window.scrollTo(0, 200);
    await wait(60);
    await bar.updateComplete;
    expect(bar.scrolled).toBe(true);
    expect(bar.hasAttribute('scrolled')).toBe(true);
    await Promise.all(
      part(bar, 'bar')
        .getAnimations()
        .map((animation) => animation.finished),
    );
    expect(getComputedStyle(part(bar, 'bar')).boxShadow).not.toBe('none');
    window.scrollTo(0, 0);
    await wait(60);
    await bar.updateComplete;
    expect(bar.scrolled).toBe(false);
  });

  it('is raised at once when it connects to an already scrolled page', async () => {
    document.body.innerHTML = `<div style="block-size: 3000px"></div>`;
    window.scrollTo(0, 300);
    await wait(30);
    const bar = document.createElement('su3-top-app-bar');
    bar.elevateOnScroll = true;
    document.body.prepend(bar);
    await bar.updateComplete;
    expect(bar.scrolled).toBe(true);
  });

  it('does not follow the window without elevate-on-scroll, and scrolled can be set', async () => {
    const bar = await render(tall(''));
    window.scrollTo(0, 200);
    await wait(60);
    expect(bar.scrolled).toBe(false);
    bar.scrolled = true;
    await bar.updateComplete;
    expect(getComputedStyle(part(bar, 'bar')).boxShadow).not.toBe('none');
  });

  it('keeps a manually set scrolled state when it is moved in the DOM', async () => {
    const bar = await render(tall(''));
    bar.scrolled = true;
    await bar.updateComplete;
    document.body.append(bar);
    await bar.updateComplete;
    expect(bar.scrolled).toBe(true);
  });

  it('drops the raised state when elevate-on-scroll is turned off, and stops listening', async () => {
    const bar = await render(tall('elevate-on-scroll'));
    window.scrollTo(0, 200);
    await wait(60);
    expect(bar.scrolled).toBe(true);
    bar.elevateOnScroll = false;
    await bar.updateComplete;
    expect(bar.scrolled).toBe(false);
    window.scrollTo(0, 300);
    await wait(60);
    expect(bar.scrolled).toBe(false);
  });
});

describe('appearance (built-in light values)', () => {
  it('follows the container and scrolled hooks', async () => {
    const bar = await render(
      basic(
        'style="--su3-comp-top-app-bar-container-color: rgb(1, 2, 3); --su3-comp-top-app-bar-scrolled-container-color: rgb(4, 5, 6)"',
      ),
    );
    expect(getComputedStyle(part(bar, 'bar')).backgroundColor).toBe('rgb(1, 2, 3)');
    bar.scrolled = true;
    await bar.updateComplete;
    await Promise.all(
      part(bar, 'bar')
        .getAnimations()
        .map((animation) => animation.finished),
    );
    expect(getComputedStyle(part(bar, 'bar')).backgroundColor).toBe('rgb(4, 5, 6)');
  });

  it('follows the height hook', async () => {
    const bar = await render(basic('style="--su3-comp-top-app-bar-height: 100px"'));
    expect(Math.round(part(bar, 'bar').getBoundingClientRect().height)).toBe(100);
  });
});
