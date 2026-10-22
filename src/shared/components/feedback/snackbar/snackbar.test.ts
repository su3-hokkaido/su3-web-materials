import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../buttons/button/index.ts';
import './index.ts';
import type { SnackbarCloseDetail, SnackbarCloseReason, Su3Snackbar } from './snackbar.ts';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function render(markup: string): Promise<Su3Snackbar> {
  document.body.innerHTML = markup;
  const snackbar = document.querySelector('su3-snackbar');
  if (!snackbar) throw new Error('No su3-snackbar was rendered');
  await snackbar.updateComplete;
  return snackbar;
}

function isCloseDetail(value: unknown): value is SnackbarCloseDetail {
  return typeof value === 'object' && value !== null && 'reason' in value;
}

function reasons(snackbar: Su3Snackbar): SnackbarCloseReason[] {
  const seen: SnackbarCloseReason[] = [];
  snackbar.addEventListener('close', (event) => {
    if (event instanceof CustomEvent && isCloseDetail(event.detail)) seen.push(event.detail.reason);
  });
  return seen;
}

const surface = (snackbar: Su3Snackbar): HTMLElement => {
  const element = snackbar.shadowRoot?.querySelector<HTMLElement>('[part="surface"]');
  if (!element) throw new Error('No surface');
  return element;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-snackbar', () => {
  it('is hidden until open and then shown in the top layer', async () => {
    const snackbar = await render('<su3-snackbar duration="0">Saved</su3-snackbar>');
    await expect.element(page.getByText('Saved')).not.toBeVisible();
    snackbar.open = true;
    await snackbar.updateComplete;
    await expect.element(page.getByText('Saved')).toBeVisible();
    expect(surface(snackbar).matches(':popover-open')).toBe(true);
    snackbar.open = false;
    await snackbar.updateComplete;
    await expect.element(page.getByText('Saved')).not.toBeVisible();
  });

  it('announces the message through a status live region without taking focus', async () => {
    await render('<su3-snackbar open duration="0">Saved</su3-snackbar>');
    await expect.element(page.getByRole('status')).toBeInTheDocument();
    expect(document.activeElement).toBe(document.body);
  });

  it('closes itself after the duration and reports a timeout', async () => {
    const snackbar = await render('<su3-snackbar open duration="150">Saved</su3-snackbar>');
    const seen = reasons(snackbar);
    await wait(400);
    expect(snackbar.open).toBe(false);
    expect(seen).toEqual(['timeout']);
  });

  it('stays open with duration 0', async () => {
    const snackbar = await render('<su3-snackbar open duration="0">Saved</su3-snackbar>');
    await wait(300);
    expect(snackbar.open).toBe(true);
  });

  it('pauses the timer while hovered and restarts it afterwards', async () => {
    const snackbar = await render('<su3-snackbar open duration="300">Saved</su3-snackbar>');
    // Synthetic events: a real pointer would stay over the surface and affect later tests.
    surface(snackbar).dispatchEvent(new PointerEvent('pointerenter'));
    await wait(600);
    expect(snackbar.open).toBe(true);
    surface(snackbar).dispatchEvent(new PointerEvent('pointerleave'));
    await wait(700);
    expect(snackbar.open).toBe(false);
  });

  it('pauses the timer while focus is inside', async () => {
    const snackbar = await render(
      '<su3-snackbar open dismissible duration="300">Saved</su3-snackbar>',
    );
    await userEvent.tab();
    await wait(600);
    expect(snackbar.open).toBe(true);
  });

  it('closes with the close button and reports a dismiss', async () => {
    const snackbar = await render(
      '<su3-snackbar open dismissible duration="0">Saved</su3-snackbar>',
    );
    const seen = reasons(snackbar);
    await page.getByRole('button', { name: 'Close' }).click();
    expect(snackbar.open).toBe(false);
    expect(seen).toEqual(['dismiss']);
  });

  it('names the close button from close-label', async () => {
    await render(
      '<su3-snackbar open dismissible close-label="Schliessen" duration="0">Saved</su3-snackbar>',
    );
    await expect.element(page.getByRole('button', { name: 'Schliessen' })).toBeVisible();
  });

  it('has no close button unless dismissible', async () => {
    await render('<su3-snackbar open duration="0">Saved</su3-snackbar>');
    expect(page.getByRole('button', { name: 'Close' }).elements()).toHaveLength(0);
  });

  it('closes when the action is used and reports the action', async () => {
    const snackbar = await render(
      '<su3-snackbar open duration="0">Saved<su3-button slot="action" variant="text">Undo</su3-button></su3-snackbar>',
    );
    const seen = reasons(snackbar);
    await page.getByRole('button', { name: 'Undo' }).click();
    expect(snackbar.open).toBe(false);
    expect(seen).toEqual(['action']);
  });

  it('does not close for a disabled action', async () => {
    const snackbar = await render(
      '<su3-snackbar open duration="0">Saved<su3-button slot="action" variant="text" disabled>Undo</su3-button></su3-snackbar>',
    );
    const seen = reasons(snackbar);
    document.querySelector('su3-button')?.click();
    expect(snackbar.open).toBe(true);
    expect(seen).toEqual([]);
  });

  it('dismisses with Escape while focus is inside', async () => {
    const snackbar = await render(
      '<su3-snackbar open dismissible duration="0">Saved</su3-snackbar>',
    );
    const seen = reasons(snackbar);
    await userEvent.tab();
    await userEvent.keyboard('{Escape}');
    expect(snackbar.open).toBe(false);
    expect(seen).toEqual(['dismiss']);
  });

  it('treats an invalid duration as no timer', async () => {
    const snackbar = await render('<su3-snackbar open duration="abc">Saved</su3-snackbar>');
    await wait(300);
    expect(snackbar.open).toBe(true);
  });

  it('restores the timer when an open snackbar is reconnected', async () => {
    const snackbar = await render('<su3-snackbar open duration="200">Saved</su3-snackbar>');
    const parent = snackbar.parentElement;
    snackbar.remove();
    parent?.append(snackbar);
    await snackbar.updateComplete;
    // A leftover real pointer can pause the timer after the re-layout (same as in the restart test).
    await wait(50);
    surface(snackbar).dispatchEvent(new PointerEvent('pointerleave'));
    await wait(500);
    expect(snackbar.open).toBe(false);
  });

  it('fires no event when closed from outside', async () => {
    const snackbar = await render('<su3-snackbar open duration="0">Saved</su3-snackbar>');
    const seen = reasons(snackbar);
    snackbar.open = false;
    await snackbar.updateComplete;
    expect(seen).toEqual([]);
  });

  it('restarts the timer each time it opens', async () => {
    const snackbar = await render('<su3-snackbar duration="200">Saved</su3-snackbar>');
    // A real click in an earlier test can leave the pointer over the surface, which pauses the
    // timer; the synthetic leave makes this test independent of it.
    const open = async (): Promise<void> => {
      snackbar.open = true;
      await snackbar.updateComplete;
      await wait(50);
      surface(snackbar).dispatchEvent(new PointerEvent('pointerleave'));
    };
    await open();
    await wait(500);
    expect(snackbar.open).toBe(false);
    await open();
    expect(snackbar.open).toBe(true);
    await wait(500);
    expect(snackbar.open).toBe(false);
  });
});

describe('appearance (built-in light values)', () => {
  it('uses the inverse of the page and follows the hooks', async () => {
    const snackbar = await render('<su3-snackbar open duration="0">Saved</su3-snackbar>');
    await wait(300);
    expect(getComputedStyle(surface(snackbar)).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    snackbar.style.setProperty('--su3-comp-snackbar-container-color', 'rgb(1, 2, 3)');
    await snackbar.updateComplete;
    expect(getComputedStyle(surface(snackbar)).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('is centered at the bottom of the viewport', async () => {
    const snackbar = await render('<su3-snackbar open duration="0">Saved</su3-snackbar>');
    await wait(300);
    const box = surface(snackbar).getBoundingClientRect();
    expect(Math.abs(box.left + box.width / 2 - window.innerWidth / 2)).toBeLessThan(2);
    expect(window.innerHeight - box.bottom).toBeLessThan(40);
  });
});
