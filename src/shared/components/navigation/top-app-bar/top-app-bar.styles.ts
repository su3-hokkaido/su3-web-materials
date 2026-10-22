import { css } from 'lit';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The public hooks are `--su3-comp-top-app-bar-*`. The bar is a grid with named areas so the three
// variants only differ in their columns and rows.
export const topAppBarStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  :host([sticky]) {
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
  }

  .bar {
    box-sizing: border-box;
    display: grid;
    grid-template-areas: 'leading title trailing';
    grid-template-columns: auto 1fr auto;
    align-items: center;
    min-block-size: ${compVar('top-app-bar-height', `calc(${sysVar('size-control-lg').cssText} + ${sysVar('space-4').cssText})`)};
    padding-inline: ${sysVar('space-2')};
    border-block-end: ${sysVar('size-border-width')} solid transparent;
    background-color: ${compVar('top-app-bar-container-color', sysVar('color-surface'))};
    color: ${compVar('top-app-bar-title-color', sysVar('color-text'))};
    font-family: ${sysVar('typeface-sans')};
    transition:
      background-color ${sysVar('motion-duration-medium')} ${sysVar('motion-easing-standard')},
      box-shadow ${sysVar('motion-duration-medium')} ${sysVar('motion-easing-standard')};
  }

  :host([scrolled]) .bar {
    background-color: ${compVar('top-app-bar-scrolled-container-color', sysVar('color-surface-raised'))};
    box-shadow: ${compVar('top-app-bar-elevation', sysVar('elevation-2'))};
    /* Shadows are faint in dark mode, so the raised bar also gets the elevation edge. */
    border-block-end-color: ${sysVar('color-elevation-edge')};
  }

  .leading,
  .trailing {
    display: flex;
    align-items: center;
    gap: ${sysVar('space-1')};
  }

  .leading {
    grid-area: leading;
  }

  .trailing {
    grid-area: trailing;
    justify-self: end;
  }

  .title {
    grid-area: title;
    min-inline-size: 0;
    padding-inline: ${sysVar('space-4')};
    overflow: hidden;
    font-size: ${sysVar('type-title-size')};
    font-weight: ${sysVar('type-title-weight')};
    line-height: ${sysVar('type-title-line-height')};
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* The slotted title is the block that overflows, so it carries the ellipsis itself. */
  ::slotted(:not([slot])) {
    margin: 0;
    overflow: hidden;
    font: inherit;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :host([variant='center']) .bar {
    grid-template-columns: 1fr auto 1fr;
  }

  :host([variant='center']) .title {
    text-align: center;
  }

  :host([variant='large']) .bar {
    grid-template-areas:
      'leading . trailing'
      'title title title';
    grid-template-columns: auto 1fr auto;
    padding-block-end: ${sysVar('space-4')};
  }

  :host([variant='large']) .title {
    padding-block-start: ${sysVar('space-3')};
    font-size: ${sysVar('type-heading-size')};
    font-weight: ${sysVar('type-heading-weight')};
    line-height: ${sysVar('type-heading-line-height')};
    white-space: normal;
  }

  :host([variant='large']) ::slotted(:not([slot])) {
    text-overflow: clip;
    white-space: normal;
  }

  @media (prefers-reduced-motion: reduce) {
    .bar {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .bar,
    :host([scrolled]) .bar {
      border-block-end-color: CanvasText;
    }
  }
`;
