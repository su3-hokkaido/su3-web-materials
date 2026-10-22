import { css } from 'lit';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The default width is six large control heights.
const defaultWidth = css`calc(${sysVar('size-control-lg')} * 6)`;

export const navigationDrawerStyles = css`
  :host {
    display: block;
  }

  /* A modal drawer is in the top layer, so its host takes no room in the layout. */
  :host(:not([modal])) {
    block-size: 100%;
  }

  :host([hidden]) {
    display: none;
  }

  :host(:not([modal])) {
    inline-size: ${compVar('navigation-drawer-width', defaultWidth)};
  }

  .nav {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    inline-size: 100%;
    block-size: 100%;
    padding: ${sysVar('space-3')};
    background-color: ${compVar('navigation-drawer-container-color', sysVar('color-surface-raised'))};
    color: ${sysVar('color-text')};
    font-family: ${sysVar('typeface-sans')};
  }

  :host(:not([modal])) .nav {
    border-inline-end: ${sysVar('size-border-width')} solid
      ${compVar('navigation-drawer-border-color', sysVar('color-border'))};
  }

  /* Shown only while something is slotted, so an unused header takes no space. */
  .header {
    display: none;
    flex-direction: column;
    margin-block-end: ${sysVar('space-3')};
  }

  .header.filled {
    display: flex;
  }

  .items {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: ${sysVar('space-1')};
    overflow-y: auto;
  }

  ::slotted(su3-navigation-item) {
    flex: none;
  }

  ::slotted(:is(h2, h3, h4)) {
    margin: 0;
    padding-block: ${sysVar('space-3')} ${sysVar('space-2')};
    padding-inline: ${sysVar('space-4')};
    color: ${compVar('navigation-drawer-heading-color', sysVar('color-text-muted'))};
    font-size: ${sysVar('type-label-sm-size')};
    font-weight: ${sysVar('type-label-weight')};
    line-height: ${sysVar('type-label-sm-line-height')};
  }

  /* Modal: a native dialog pinned to the inline-start edge, with the scrim as its backdrop. */
  .dialog {
    box-sizing: border-box;
    inset-block: 0;
    inset-inline: 0 auto;
    inline-size: ${compVar('navigation-drawer-width', defaultWidth)};
    max-inline-size: calc(100% - ${sysVar('space-8')});
    block-size: 100%;
    max-block-size: none;
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-start-end-radius: ${compVar('navigation-drawer-shape', sysVar('shape-lg'))};
    border-end-end-radius: ${compVar('navigation-drawer-shape', sysVar('shape-lg'))};
    background: none;
    color: inherit;
    box-shadow: ${compVar('navigation-drawer-elevation', sysVar('elevation-3'))};
    transform: translateX(-100%);
    transition:
      transform ${sysVar('motion-duration-medium')} ${sysVar('motion-easing-exit')},
      overlay ${sysVar('motion-duration-medium')} allow-discrete,
      display ${sysVar('motion-duration-medium')} allow-discrete;
  }

  /* The dialog is a container: the focused item inside shows the focus indicator. */
  .dialog:focus-visible {
    outline: none;
  }

  .dialog:dir(rtl) {
    transform: translateX(100%);
  }

  .dialog[open] {
    transform: none;
    transition:
      transform ${sysVar('motion-duration-medium')} ${sysVar('motion-easing-standard')},
      overlay ${sysVar('motion-duration-medium')} allow-discrete,
      display ${sysVar('motion-duration-medium')} allow-discrete;
  }

  .dialog::backdrop {
    background-color: ${compVar('navigation-drawer-scrim-color', sysVar('color-overlay'))};
    opacity: 0;
    transition:
      opacity ${sysVar('motion-duration-medium')} ${sysVar('motion-easing-standard')},
      overlay ${sysVar('motion-duration-medium')} allow-discrete,
      display ${sysVar('motion-duration-medium')} allow-discrete;
  }

  .dialog[open]::backdrop {
    opacity: 1;
  }

  @starting-style {
    .dialog[open] {
      transform: translateX(-100%);
    }

    .dialog[open]:dir(rtl) {
      transform: translateX(100%);
    }

    .dialog[open]::backdrop {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dialog,
    .dialog::backdrop {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    :host(:not([modal])) .nav {
      border-inline-end-color: CanvasText;
    }

    .dialog {
      border: ${sysVar('size-border-width')} solid CanvasText;
    }
  }
`;
