import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import './index.ts';
import type { Su3Segment } from './segment.ts';

async function render(markup: string): Promise<Su3Segment> {
  document.body.innerHTML = markup;
  const segment = document.querySelector('su3-segment');
  if (!segment) throw new Error('No su3-segment was rendered');
  await segment.updateComplete;
  return segment;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('su3-segment', () => {
  it('renders a radio by default, named by its content', async () => {
    await render('<su3-segment value="a">Day</su3-segment>');
    await expect.element(page.getByRole('radio', { name: 'Day' })).toBeVisible();
    await expect.element(page.getByRole('radio')).not.toBeChecked();
  });

  it('reflects selected and renders it as checked', async () => {
    const segment = await render('<su3-segment value="a">Day</su3-segment>');
    segment.selected = true;
    await segment.updateComplete;
    expect(segment.hasAttribute('selected')).toBe(true);
    await expect.element(page.getByRole('radio')).toBeChecked();
  });

  it('is a toggle button in multiple mode', async () => {
    const segment = await render('<su3-segment value="a">Day</su3-segment>');
    segment.selectionMode = 'multiple';
    segment.selected = true;
    await segment.updateComplete;
    await expect
      .element(page.getByRole('button', { name: 'Day' }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it('uses aria-label for a segment without text and removes the tab stop on request', async () => {
    const segment = await render('<su3-segment value="a" aria-label="Day view"></su3-segment>');
    await expect.element(page.getByRole('radio', { name: 'Day view' })).toBeVisible();
    segment.tabbable = false;
    await segment.updateComplete;
    await expect.element(page.getByRole('radio')).toHaveAttribute('tabindex', '-1');
  });

  it('is disabled itself or through the group, and reflects disabled', async () => {
    const segment = await render('<su3-segment value="a">Day</su3-segment>');
    expect(segment.isDisabled).toBe(false);
    segment.groupDisabled = true;
    await segment.updateComplete;
    expect(segment.isDisabled).toBe(true);
    await expect.element(page.getByRole('radio')).toBeDisabled();
    segment.groupDisabled = false;
    segment.disabled = true;
    await segment.updateComplete;
    expect(segment.hasAttribute('disabled')).toBe(true);
    expect(segment.isDisabled).toBe(true);
  });

  it('takes focus through the host', async () => {
    const segment = await render('<su3-segment value="a">Day</su3-segment>');
    segment.focus();
    expect(segment.matches(':focus')).toBe(true);
  });
});
