import { css } from 'lit';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The default maximum width is ten large control heights.
const defaultMaxWidth = css`calc(${sysVar('size-control-lg')} * 10)`;

// The public hooks are `--su3-comp-dialog-*`. The <dialog> is the surface and `.panel` fills it, so
// the only click that targets the dialog itself is a click on the scrim.
export const dialogStyles = css`
  :host {
    display: contents;
  }

  :host([hidden]) {
    display: none;
  }

  .dialog {
    box-sizing: border-box;
    inline-size: min(
      ${compVar('dialog-max-width', defaultMaxWidth)},
      calc(100% - 2 * ${sysVar('space-6')})
    );
    max-block-size: calc(100% - 2 * ${sysVar('space-6')});
    margin: auto;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: ${compVar('dialog-container-shape', sysVar('shape-lg'))};
    background-color: ${compVar('dialog-container-color', sysVar('color-surface-raised'))};
    color: ${sysVar('color-text')};
    box-shadow: ${compVar('dialog-elevation', sysVar('elevation-3'))};
    font-family: ${sysVar('typeface-sans')};
    opacity: 0;
    transform: translateY(${sysVar('space-4')});
    transition:
      opacity ${sysVar('motion-duration-medium')} ${sysVar('motion-easing-exit')},
      transform ${sysVar('motion-duration-medium')} ${sysVar('motion-easing-exit')},
      overlay ${sysVar('motion-duration-medium')} allow-discrete,
      display ${sysVar('motion-duration-medium')} allow-discrete;
  }

  .dialog[open] {
    display: flex;
    opacity: 1;
    transform: none;
    transition:
      opacity ${sysVar('motion-duration-medium')} ${sysVar('motion-easing-standard')},
      transform ${sysVar('motion-duration-medium')} ${sysVar('motion-easing-standard')},
      overlay ${sysVar('motion-duration-medium')} allow-discrete,
      display ${sysVar('motion-duration-medium')} allow-discrete;
  }

  /* The dialog is a container: the focused control inside shows the focus indicator. */
  .dialog:focus-visible {
    outline: none;
  }

  .panel {
    box-sizing: border-box;
    display: flex;
    flex: 1;
    flex-direction: column;
    min-block-size: 0;
    padding: ${sysVar('space-6')};
  }

  /*
   * The regions are always rendered, so slotted controls are focusable from the first frame; the
   * spacing around them only exists while something is slotted.
   */
  .headline {
    margin: 0;
    color: ${compVar('dialog-headline-color', sysVar('color-text'))};
    font-size: ${sysVar('type-title-size')};
    font-weight: ${sysVar('type-title-weight')};
    line-height: ${sysVar('type-title-line-height')};
  }

  .headline.filled {
    padding-block-end: ${sysVar('space-4')};
  }

  .content {
    flex: 1;
    min-block-size: 0;
    overflow: auto;
    font-size: ${sysVar('type-body-size')};
    font-weight: ${sysVar('type-body-weight')};
    line-height: ${sysVar('type-body-line-height')};
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: ${sysVar('space-2')};
  }

  .actions.filled {
    padding-block-start: ${sysVar('space-6')};
  }

  :host([fullscreen]) .dialog {
    inline-size: 100%;
    max-inline-size: none;
    block-size: 100%;
    max-block-size: none;
    border-radius: 0;
  }

  .dialog::backdrop {
    background-color: ${compVar('dialog-scrim-color', sysVar('color-overlay'))};
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
      opacity: 0;
      transform: translateY(${sysVar('space-4')});
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
    .dialog {
      border: ${sysVar('size-border-width')} solid CanvasText;
    }
  }
`;
