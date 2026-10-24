import { afterEach, describe, expect, it } from 'vitest';
import { placePopup } from './popup-position.ts';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** An anchor and a fixed popup of a known size, both positioned in pixels. */
function setup(
  anchorStyle: string,
  popupStyle = '',
  margin = '8px',
): { anchor: HTMLElement; popup: HTMLElement } {
  document.body.innerHTML = `<div id="anchor" style="position: fixed; width: 100px; height: 40px; ${anchorStyle}">anchor</div>
    <div id="popup" style="position: fixed; inset: auto; width: 160px; height: 120px; margin: ${margin}; ${popupStyle}">popup</div>`;
  const anchor = document.getElementById('anchor');
  const popup = document.getElementById('popup');
  if (!anchor || !popup) throw new Error('No elements');
  return { anchor, popup };
}

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('dir');
});

describe('placePopup', () => {
  it('puts the popup below the anchor, at its start edge, with the gap between them', () => {
    const { anchor, popup } = setup('left: 200px; top: 100px');
    placePopup(popup, anchor, { side: 'bottom', align: 'start' });
    const box = popup.getBoundingClientRect();
    const target = anchor.getBoundingClientRect();
    expect(Math.round(box.left - target.left)).toBe(0);
    expect(Math.round(box.top - target.bottom)).toBe(8);
  });

  it('aligns to the end edge', () => {
    const { anchor, popup } = setup('left: 300px; top: 100px');
    placePopup(popup, anchor, { side: 'bottom', align: 'end' });
    expect(
      Math.round(popup.getBoundingClientRect().right - anchor.getBoundingClientRect().right),
    ).toBe(0);
  });

  it('mirrors the alignment in right-to-left text', () => {
    document.documentElement.dir = 'rtl';
    const { anchor, popup } = setup('left: 300px; top: 100px');
    placePopup(popup, anchor, { side: 'bottom', align: 'start' });
    expect(
      Math.round(popup.getBoundingClientRect().right - anchor.getBoundingClientRect().right),
    ).toBe(0);
  });

  it('puts the popup above when asked, and flips below when there is no room above', () => {
    const above = setup('left: 200px; top: 300px');
    placePopup(above.popup, above.anchor, { side: 'top', align: 'start' });
    expect(above.popup.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      above.anchor.getBoundingClientRect().top,
    );
    const flipped = setup('left: 200px; top: 10px');
    placePopup(flipped.popup, flipped.anchor, { side: 'top', align: 'start' });
    expect(flipped.popup.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      flipped.anchor.getBoundingClientRect().bottom,
    );
  });

  it('flips above when there is no room below', () => {
    const { anchor, popup } = setup(`left: 200px; top: ${String(window.innerHeight - 50)}px`);
    placePopup(popup, anchor, { side: 'bottom', align: 'start' });
    expect(popup.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      anchor.getBoundingClientRect().top,
    );
  });

  it('stays inside the viewport at every edge, also when neither side fits', () => {
    const left = setup('left: 0px; top: 100px');
    placePopup(left.popup, left.anchor, { side: 'bottom', align: 'end' });
    expect(left.popup.getBoundingClientRect().left).toBeGreaterThanOrEqual(0);
    const right = setup(
      `left: ${String(document.documentElement.clientWidth - 100)}px; top: 100px`,
    );
    placePopup(right.popup, right.anchor, { side: 'bottom', align: 'start' });
    expect(right.popup.getBoundingClientRect().right).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
    const tall = setup('left: 200px; top: 100px', `height: ${String(window.innerHeight + 200)}px`);
    placePopup(tall.popup, tall.anchor, { side: 'bottom', align: 'start' });
    expect(tall.popup.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
  });

  it('gives the popup at least the width of the anchor with matchWidth', () => {
    const { anchor, popup } = setup('left: 200px; top: 100px; width: 300px', 'width: 50px');
    placePopup(popup, anchor, { side: 'bottom', align: 'start', matchWidth: true });
    expect(Math.round(popup.getBoundingClientRect().width)).toBeGreaterThanOrEqual(300);
  });

  it('copes with a popup that has no margin', async () => {
    const { anchor, popup } = setup('left: 200px; top: 100px', '', '0');
    placePopup(popup, anchor, { side: 'bottom', align: 'start' });
    await wait(0);
    expect(
      Math.round(popup.getBoundingClientRect().top - anchor.getBoundingClientRect().bottom),
    ).toBe(0);
  });
});
