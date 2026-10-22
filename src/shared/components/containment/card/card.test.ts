import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../buttons/button/index.ts';
import './index.ts';
import type { Su3Card } from './card.ts';

async function render(markup: string): Promise<Su3Card> {
  document.body.innerHTML = markup;
  const card = document.querySelector('su3-card');
  if (!card) throw new Error('No su3-card was rendered');
  await card.updateComplete;
  // slotchange fires after the first render and re-renders the card once more.
  await settle();
  await card.updateComplete;
  return card;
}

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

const part = (host: Su3Card, name: string): HTMLElement => {
  const element = host.shadowRoot?.querySelector<HTMLElement>(`[part="${name}"]`);
  if (!element) throw new Error(`The ${name} part was not rendered`);
  return element;
};

const style = (host: Su3Card, name = 'card') => getComputedStyle(part(host, name));

const full = `<su3-card>
  <div slot="media" style="height: 40px"></div>
  <span slot="header">Title</span>
  <span>Body text</span>
  <su3-button slot="actions">Open</su3-button>
</su3-card>`;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('structure and accessibility', () => {
  it('shows the slotted content and adds no role of its own', async () => {
    const host = await render(full);
    await expect.element(page.getByText('Title')).toBeVisible();
    await expect.element(page.getByText('Body text')).toBeVisible();
    expect(part(host, 'card').getAttribute('role')).toBeNull();
    expect(host.hasAttribute('tabindex')).toBe(false);
  });

  it('leaves actions reachable and gives the card no tab stop of its own', async () => {
    const host = await render(full);
    await userEvent.tab();
    expect(document.activeElement).toBe(document.querySelector('su3-button'));
    expect(host.matches(':focus')).toBe(false);
    await expect.element(page.getByRole('button', { name: 'Open' })).toBeVisible();
  });

  it('collapses empty areas and shows them once they have content', async () => {
    const host = await render('<su3-card>Only a body</su3-card>');
    expect(part(host, 'media').hidden).toBe(true);
    expect(part(host, 'header').hidden).toBe(true);
    expect(part(host, 'actions').hidden).toBe(true);
    expect(part(host, 'body').hidden).toBe(false);

    const header = document.createElement('span');
    header.slot = 'header';
    header.textContent = 'Added';
    host.append(header);
    await settle();
    await host.updateComplete;
    expect(part(host, 'header').hidden).toBe(false);

    header.remove();
    await settle();
    await host.updateComplete;
    expect(part(host, 'header').hidden).toBe(true);
  });

  it('treats whitespace-only content as empty', async () => {
    const host = await render('<su3-card>   <span slot="header">  </span></su3-card>');
    expect(part(host, 'body').hidden).toBe(true);
  });
});

describe('variants (built-in light values)', () => {
  it('is elevated by default: raised surface, an edge and a shadow', async () => {
    const host = await render(full);
    expect(host.variant).toBe('elevated');
    expect(style(host).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(style(host).boxShadow).not.toBe('none');
  });

  it('filled uses the sunken surface and no shadow', async () => {
    const host = await render(full.replace('<su3-card>', '<su3-card variant="filled">'));
    expect(style(host).backgroundColor).not.toBe('rgb(255, 255, 255)');
    expect(style(host).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(style(host).boxShadow).toBe('none');
  });

  it('outlined is transparent with a visible border and no shadow', async () => {
    const host = await render(full.replace('<su3-card>', '<su3-card variant="outlined">'));
    expect(style(host).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(style(host).borderTopColor).toBe('rgb(225, 233, 239)');
    expect(style(host).borderTopWidth).toBe('1px');
    expect(style(host).boxShadow).toBe('none');
  });

  it('reflects the variant attribute', async () => {
    const host = await render(full);
    host.variant = 'outlined';
    await host.updateComplete;
    expect(host.getAttribute('variant')).toBe('outlined');
  });

  it('clips media to the rounded corners', async () => {
    const host = await render(full);
    expect(style(host).overflow).toBe('hidden');
    expect(style(host).borderTopLeftRadius).toBe('8px');
  });

  it('adds top padding only when there is no media', async () => {
    const withMedia = await render(full);
    expect(style(withMedia).paddingTop).toBe('0px');
    const without = await render('<su3-card><span slot="header">T</span>Body</su3-card>');
    expect(style(without).paddingTop).toBe('16px');
  });
});

describe('media-only card', () => {
  it('has no empty strip below the media', async () => {
    const host = await render('<su3-card><div slot="media" style="height: 40px"></div></su3-card>');
    expect(style(host).paddingBottom).toBe('0px');
    expect(host.getBoundingClientRect().height).toBeLessThan(44);
  });
});

describe('component hooks', () => {
  it('follows the --su3-comp-card-* hooks', async () => {
    const host = await render(
      '<su3-card style="--su3-comp-card-container-color: rgb(1, 2, 3); --su3-comp-card-container-shape: 20px; --su3-comp-card-padding: 24px; --su3-comp-card-text-color: rgb(4, 5, 6)">Body</su3-card>',
    );
    expect(style(host).backgroundColor).toBe('rgb(1, 2, 3)');
    expect(style(host).borderTopLeftRadius).toBe('20px');
    expect(style(host, 'body').paddingLeft).toBe('24px');
    expect(style(host).color).toBe('rgb(4, 5, 6)');
  });
});
