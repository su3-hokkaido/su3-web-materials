import { css } from 'lit';
import { focusRing, focusRingForcedColors } from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The row height comes from the table through the private `--_row-height` property it sets on
// itself (inherited by its rows and cells). The public hooks are `--su3-comp-data-table-*`.
export const tableCellStyles = css`
  :host {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    min-inline-size: 0;
    min-block-size: var(--_row-height, ${sysVar('size-control-lg')});
    padding-inline: ${sysVar('space-4')};
    outline: none;
    color: ${compVar('data-table-text-color', sysVar('color-text'))};
    font-family: ${sysVar('typeface-sans')};
    font-size: ${sysVar('type-body-size')};
    line-height: ${sysVar('type-body-line-height')};
  }

  :host([hidden]) {
    display: none;
  }

  :host([align='center']) {
    justify-content: center;
    text-align: center;
  }

  :host([align='end']) {
    justify-content: flex-end;
    text-align: end;
  }

  :host([header]) {
    color: ${compVar('data-table-header-color', sysVar('color-text-muted'))};
    font-size: ${sysVar('type-label-size')};
    font-weight: ${sysVar('type-label-weight')};
    line-height: ${sysVar('type-label-line-height')};
  }

  .content {
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :host([header][sortable]) {
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  :host([header][sortable]:hover) {
    background-color: color-mix(
      in srgb,
      ${sysVar('color-text')} calc(${sysVar('state-hover-opacity')} * 100%),
      transparent
    );
  }

  :host(:focus-visible) {
    ${focusRing('data-table')}
    outline-offset: calc(-1 * ${sysVar('size-focus-ring-width')});
  }

  .sort {
    flex: none;
    inline-size: ${sysVar('size-icon-sm')};
    block-size: ${sysVar('size-icon-sm')};
    margin-inline-start: ${sysVar('space-1')};
    opacity: 0.4;
    transition: opacity ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')};
  }

  :host([sort='ascending']) .sort,
  :host([sort='descending']) .sort,
  :host([sortable]:hover) .sort,
  :host(:focus-visible) .sort {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .sort {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    :host {
      color: CanvasText;
    }

    :host(:focus-visible) {
      ${focusRingForcedColors}
    }
  }
`;
