import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../buttons/button/index.ts';
import './index.ts';
import type { DialogCloseDetail, Su3Dialog } from './dialog.ts';

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30));

async function render(markup: string): Promise<Su3Dialog> {
  document.body.innerHTML = markup;
  const dialog = document.querySelector('su3-dialog');
  if (!dialog) throw new Error('No su3-dialog was rendered');
  await dialog.updateComplete;
  await settle();
  await dialog.updateComplete;
  return dialog;
}

const inner = (dialog: Su3Dialog): HTMLDialogElement => {
  const element = dialog.shadowRoot?.querySelector('dialog');
  if (!element) throw new Error('No dialog');
  return element;
};

function isCloseDetail(value: unknown): value is DialogCloseDetail {
  return typeof value === 'object' && value !== null && 'reason' in value;
}

function closes(dialog: Su3Dialog): DialogCloseDetail[] {
  const seen: DialogCloseDetail[] = [];
  dialog.addEventListener('close', (event) => {
    if (event instanceof CustomEvent && isCloseDetail(event.detail)) seen.push(event.detail);
  });
  return seen;
}

const basic = (attributes = ''): string => `<button id="opener">Open</button>
<su3-dialog ${attributes}>
  <span slot="headline">Discard draft?</span>
  <p>Your draft has not been sent.</p>
  <su3-button slot="actions" variant="text" dialog-action="cancel">Keep editing</su3-button>
  <su3-button slot="actions" variant="text" dialog-action="discard">Discard</su3-button>
</su3-dialog>`;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-dialog', () => {
  it('is hidden until open and then shown as a modal dialog', async () => {
    const dialog = await render(basic());
    expect(inner(dialog).open).toBe(false);
    await expect.element(page.getByText('Your draft has not been sent.')).not.toBeVisible();
    dialog.open = true;
    await dialog.updateComplete;
    expect(inner(dialog).open).toBe(true);
    expect(inner(dialog).matches(':modal')).toBe(true);
    await expect.element(page.getByText('Your draft has not been sent.')).toBeVisible();
  });

  it('is named by its headline and has the dialog role', async () => {
    await render(basic('open'));
    await expect.element(page.getByRole('dialog', { name: 'Discard draft?' })).toBeVisible();
    await expect.element(page.getByRole('heading', { name: 'Discard draft?' })).toBeVisible();
  });

  it('uses aria-label when there is no headline', async () => {
    await render('<su3-dialog open aria-label="Preferences"><p>Content</p></su3-dialog>');
    await expect.element(page.getByRole('dialog', { name: 'Preferences' })).toBeVisible();
  });

  it('gives the alertdialog role with alert', async () => {
    await render(basic('open alert'));
    await expect.element(page.getByRole('alertdialog', { name: 'Discard draft?' })).toBeVisible();
  });

  it('moves focus into the dialog on open and back to the opener on close', async () => {
    const dialog = await render(basic());
    const opener = document.getElementById('opener');
    opener?.focus();
    dialog.open = true;
    await dialog.updateComplete;
    await settle();
    expect(dialog.contains(document.activeElement)).toBe(true);
    dialog.open = false;
    await dialog.updateComplete;
    await settle();
    expect(document.activeElement).toBe(opener);
  });

  it('focuses the element marked autofocus', async () => {
    const dialog = await render(
      '<su3-dialog open><span slot="headline">Title</span><su3-button autofocus slot="actions">Go</su3-button><su3-button slot="actions">Other</su3-button></su3-dialog>',
    );
    await settle();
    expect(document.activeElement).toBe(dialog.querySelector('[autofocus]'));
  });

  it('keeps Tab inside the open dialog', async () => {
    const dialog = await render(basic('open'));
    for (let i = 0; i < 5; i += 1) await userEvent.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});

describe('closing', () => {
  it('closes on Escape and reports it', async () => {
    const dialog = await render(basic('open'));
    const seen = closes(dialog);
    await userEvent.keyboard('{Escape}');
    await dialog.updateComplete;
    expect(dialog.open).toBe(false);
    expect(inner(dialog).open).toBe(false);
    expect(seen).toEqual([{ reason: 'escape' }]);
  });

  it('closes on a click on the scrim, not on the content', async () => {
    const dialog = await render(basic('open'));
    const seen = closes(dialog);
    await page.getByText('Your draft has not been sent.').click();
    expect(dialog.open).toBe(true);
    await userEvent.click(document.body, { position: { x: 4, y: 4 } });
    await dialog.updateComplete;
    expect(dialog.open).toBe(false);
    expect(seen).toEqual([{ reason: 'scrim' }]);
  });

  it('closes with the action value when an element with dialog-action is clicked', async () => {
    const dialog = await render(basic('open'));
    const seen = closes(dialog);
    await page.getByRole('button', { name: 'Discard' }).click();
    await dialog.updateComplete;
    expect(dialog.open).toBe(false);
    expect(seen).toEqual([{ reason: 'action', action: 'discard' }]);
  });

  it('ignores a disabled action', async () => {
    const dialog = await render(
      '<su3-dialog open><span slot="headline">T</span><su3-button slot="actions" dialog-action="x" disabled>Go</su3-button></su3-dialog>',
    );
    const seen = closes(dialog);
    dialog.querySelector('su3-button')?.click();
    expect(dialog.open).toBe(true);
    expect(seen).toEqual([]);
  });

  it('does not close for a click on content or on an action without dialog-action', async () => {
    const dialog = await render(
      '<su3-dialog open><span slot="headline">T</span><p>Body</p><su3-button slot="actions">Plain</su3-button></su3-dialog>',
    );
    await page.getByRole('button', { name: 'Plain' }).click();
    expect(dialog.open).toBe(true);
  });

  it('fires no event when closed from outside', async () => {
    const dialog = await render(basic('open'));
    const seen = closes(dialog);
    dialog.open = false;
    await dialog.updateComplete;
    expect(seen).toEqual([]);
    expect(inner(dialog).open).toBe(false);
  });

  it('ignores Escape and the scrim when persistent, and still closes with an action', async () => {
    const dialog = await render(basic('open persistent'));
    const seen = closes(dialog);
    await userEvent.keyboard('{Escape}');
    await userEvent.click(document.body, { position: { x: 4, y: 4 } });
    await dialog.updateComplete;
    expect(dialog.open).toBe(true);
    expect(inner(dialog).open).toBe(true);
    await page.getByRole('button', { name: 'Keep editing' }).click();
    expect(seen).toEqual([{ reason: 'action', action: 'cancel' }]);
  });

  it('can be reopened after closing', async () => {
    const dialog = await render(basic('open'));
    await page.getByRole('button', { name: 'Discard' }).click();
    await dialog.updateComplete;
    dialog.open = true;
    await dialog.updateComplete;
    expect(inner(dialog).open).toBe(true);
  });
});

describe('layout and appearance (built-in light values)', () => {
  it('is centered and at most the maximum width', async () => {
    const dialog = await render(basic('open'));
    await Promise.all(
      inner(dialog)
        .getAnimations()
        .map((animation) => animation.finished),
    );
    const box = inner(dialog).getBoundingClientRect();
    expect(Math.abs(box.left + box.width / 2 - window.innerWidth / 2)).toBeLessThan(2);
    expect(Math.abs(box.top + box.height / 2 - window.innerHeight / 2)).toBeLessThan(2);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    expect(box.width).toBeLessThanOrEqual(30 * rem + 1);
  });

  it('shows the headline above the content above the actions, actions at the end', async () => {
    const dialog = await render(basic('open'));
    await Promise.all(
      inner(dialog)
        .getAnimations()
        .map((animation) => animation.finished),
    );
    const headline = page.getByRole('heading').element().getBoundingClientRect();
    const body = page.getByText('Your draft has not been sent.').element().getBoundingClientRect();
    const discard = page.getByRole('button', { name: 'Discard' }).element().getBoundingClientRect();
    expect(headline.bottom).toBeLessThanOrEqual(body.top);
    expect(body.bottom).toBeLessThanOrEqual(discard.top);
    expect(
      Math.abs(discard.right - (inner(dialog).getBoundingClientRect().right - 24)),
    ).toBeLessThan(3);
  });

  it('takes no room for an empty headline and empty actions', async () => {
    const dialog = await render('<su3-dialog open><p>Only content</p></su3-dialog>');
    const headline = dialog.shadowRoot?.querySelector('[part="headline"]');
    const actions = dialog.shadowRoot?.querySelector('[part="actions"]');
    if (!headline || !actions) throw new Error('No regions');
    expect(headline.getBoundingClientRect().height).toBe(0);
    expect(actions.getBoundingClientRect().height).toBe(0);
  });

  it('scrolls long content inside the dialog', async () => {
    const dialog = await render(
      `<su3-dialog open><span slot="headline">T</span><div style="block-size: 3000px">Tall</div><su3-button slot="actions" dialog-action="ok">OK</su3-button></su3-dialog>`,
    );
    await Promise.all(
      inner(dialog)
        .getAnimations()
        .map((animation) => animation.finished),
    );
    const box = inner(dialog).getBoundingClientRect();
    expect(box.height).toBeLessThan(window.innerHeight);
    const content = dialog.shadowRoot?.querySelector('[part="content"]');
    if (!content) throw new Error('No content');
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    await expect.element(page.getByRole('button', { name: 'OK' })).toBeVisible();
  });

  it('fills the viewport when fullscreen', async () => {
    const dialog = await render(basic('open fullscreen'));
    await Promise.all(
      inner(dialog)
        .getAnimations()
        .map((animation) => animation.finished),
    );
    const box = inner(dialog).getBoundingClientRect();
    expect(Math.round(box.width)).toBe(document.documentElement.clientWidth);
    expect(Math.round(box.height)).toBe(window.innerHeight);
  });

  it('follows the container hook', async () => {
    const dialog = await render(
      basic('open style="--su3-comp-dialog-container-color: rgb(1, 2, 3)"'),
    );
    expect(getComputedStyle(inner(dialog)).backgroundColor).toBe('rgb(1, 2, 3)');
  });
});
