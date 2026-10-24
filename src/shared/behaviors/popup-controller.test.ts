import { html, LitElement, type TemplateResult } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { PopupController } from './popup-controller.ts';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** A host with a popover surface, to drive the controller without a real component. */
class PopupHost extends LitElement {
  static override properties = { open: { type: Boolean } };
  declare open: boolean;
  outside = 0;
  readonly popup: PopupController = new PopupController(this, {
    surface: (): HTMLElement | null => this.renderRoot.querySelector<HTMLElement>('.surface'),
    anchor: (): Element | null => this.renderRoot.querySelector('.anchor'),
    placement: () => ({ side: 'bottom', align: 'start' }),
    onOutsidePress: () => {
      this.outside += 1;
    },
  });

  constructor() {
    super();
    this.open = false;
  }

  protected override updated(): void {
    this.popup.sync(this.open);
  }

  protected override render(): TemplateResult {
    return html`<div class="anchor" style="width: 100px; height: 30px">anchor</div>
      <div
        class="surface"
        popover="manual"
        style="position: fixed; inset: auto; margin: 4px; width: 80px; height: 60px"
      >
        popup
      </div>`;
  }
}
customElements.define('popup-test-host', PopupHost);

async function render(open: boolean): Promise<PopupHost> {
  document.body.innerHTML = `<p id="outside">outside</p><popup-test-host style="display: block; margin: 100px"></popup-test-host>`;
  const host = document.querySelector<PopupHost>('popup-test-host');
  if (!host) throw new Error('No host');
  host.open = open;
  await host.updateComplete;
  return host;
}

const surface = (host: PopupHost): HTMLElement => {
  const element = host.shadowRoot?.querySelector<HTMLElement>('.surface');
  if (!element) throw new Error('No surface');
  return element;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('PopupController', () => {
  it('shows and hides the popover from open, and places it under the anchor', async () => {
    const host = await render(false);
    expect(surface(host).matches(':popover-open')).toBe(false);
    host.open = true;
    await host.updateComplete;
    expect(surface(host).matches(':popover-open')).toBe(true);
    const anchor = host.shadowRoot?.querySelector('.anchor')?.getBoundingClientRect();
    const tip = surface(host).getBoundingClientRect();
    expect(Math.round(tip.top - (anchor?.bottom ?? 0))).toBe(4);
    host.open = false;
    await host.updateComplete;
    expect(surface(host).matches(':popover-open')).toBe(false);
  });

  it('reports true only for the sync that shows the popover', async () => {
    const host = await render(false);
    expect(host.popup.sync(false)).toBe(false);
    expect(host.popup.sync(true)).toBe(true);
    expect(host.popup.sync(true)).toBe(false);
    expect(host.popup.sync(false)).toBe(false);
  });

  it('calls onOutsidePress for a press outside the host, not for one inside it', async () => {
    const host = await render(true);
    document
      .getElementById('outside')
      ?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect(host.outside).toBe(1);
    host.shadowRoot
      ?.querySelector('.anchor')
      ?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect(host.outside).toBe(1);
  });

  it('stops listening once the popover is closed', async () => {
    const host = await render(true);
    host.open = false;
    await host.updateComplete;
    document
      .getElementById('outside')
      ?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect(host.outside).toBe(0);
  });

  it('stops listening when the host is removed', async () => {
    const host = await render(true);
    host.remove();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect(host.outside).toBe(0);
  });

  it('places the popover again when the anchor changes size', async () => {
    const host = await render(true);
    const anchor = host.shadowRoot?.querySelector<HTMLElement>('.anchor');
    if (!anchor) throw new Error('No anchor');
    const before = surface(host).getBoundingClientRect().top;
    anchor.style.height = '90px';
    await wait(100);
    expect(surface(host).getBoundingClientRect().top).toBeGreaterThan(before + 40);
  });

  it('places the popover again on resize and on scroll, once per frame', async () => {
    const host = await render(true);
    const before = surface(host).style.top;
    surface(host).style.top = '0px';
    window.dispatchEvent(new Event('resize'));
    await wait(60);
    expect(surface(host).style.top).toBe(before);
    surface(host).style.top = '0px';
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    await wait(60);
    expect(surface(host).style.top).toBe(before);
  });

  it('does nothing without a surface or an anchor', async () => {
    const host = await render(false);
    host.shadowRoot?.querySelector('.surface')?.remove();
    expect(host.popup.sync(true)).toBe(false);
    expect(() => {
      host.popup.place();
    }).not.toThrow();
  });
});
