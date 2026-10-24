import { css } from 'lit';
import {
  fieldFrame,
  focusRing,
  focusRingForcedColors,
  stateLayerBox,
  stateLayerOpacity,
} from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The field frame is shared with the select and the date picker; this adds the popup surface and the
// columns of options. The public hooks are `--su3-comp-time-picker-*`.
export const timePickerStyles = [
  fieldFrame('time-picker'),
  css`
    .surface {
      position: fixed;
      inset: auto;
      box-sizing: border-box;
      display: none;
      max-block-size: calc(100% - 2 * ${sysVar('space-4')});
      margin: ${compVar('time-picker-offset', sysVar('space-1'))};
      padding: ${sysVar('space-2')};
      overflow-y: auto;
      border: ${sysVar('size-border-width')} solid ${sysVar('color-elevation-edge')};
      border-radius: ${compVar('time-picker-menu-shape', sysVar('shape-md'))};
      background-color: ${compVar('time-picker-menu-color', sysVar('color-surface-raised'))};
      box-shadow: ${compVar('time-picker-menu-elevation', sysVar('elevation-2'))};
      color: ${sysVar('color-text')};
    }

    .surface:popover-open {
      display: block;
      animation: time-picker-enter ${sysVar('motion-duration-fast')}
        ${sysVar('motion-easing-standard')};
    }

    @keyframes time-picker-enter {
      from {
        opacity: 0;
      }
    }

    :host([inline]) {
      display: inline-block;
    }

    /* The columns sit side by side; each scrolls on its own when it is taller than the limit. */
    .columns {
      display: flex;
      gap: ${sysVar('space-1')};
      font-family: ${sysVar('typeface-sans')};
    }

    .column {
      display: flex;
      flex-direction: column;
      gap: ${sysVar('space-1')};
      max-block-size: calc(${sysVar('size-control-md')} * 6);
      overflow-y: auto;
      padding-inline: ${sysVar('space-1')};
      scrollbar-width: thin;
    }

    .column + .column {
      border-inline-start: ${sysVar('size-border-width')} solid ${sysVar('color-border')};
    }

    .option {
      position: relative;
      box-sizing: border-box;
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      inline-size: calc(${sysVar('size-control-md')} * 1.5);
      block-size: ${sysVar('size-control-md')};
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: ${sysVar('shape-pill')};
      background: none;
      color: inherit;
      font: inherit;
      font-size: ${sysVar('type-label-size')};
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }

    .option::before {
      ${stateLayerBox()}
    }

    .option:hover:not([aria-disabled='true'])::before {
      ${stateLayerOpacity.hover}
    }

    .option:focus-visible::before {
      ${stateLayerOpacity.focus}
    }

    .option:focus-visible {
      ${focusRing('time-picker')}
    }

    .option[aria-selected='true'] {
      background-color: ${compVar('time-picker-selected-color', sysVar('color-accent'))};
      color: ${compVar('time-picker-on-selected-color', sysVar('color-on-accent'))};
    }

    .option[aria-disabled='true'] {
      cursor: default;
      color: color-mix(
        in srgb,
        ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
        transparent
      );
    }

    .columns.disabled {
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .surface:popover-open {
        animation: none;
      }

      .option::before {
        transition: none;
      }
    }

    @media (forced-colors: active) {
      .surface {
        border-color: CanvasText;
      }

      .option {
        color: ButtonText;
      }

      .option[aria-selected='true'] {
        background-color: Highlight;
        color: HighlightText;
      }

      .option:focus-visible {
        ${focusRingForcedColors}
      }

      .option[aria-disabled='true'] {
        color: GrayText;
      }
    }
  `,
];
