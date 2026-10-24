import { css } from 'lit';
import {
  fieldFrame,
  focusRing,
  focusRingForcedColors,
  stateLayerBox,
  stateLayerOpacity,
} from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// The field frame is shared with the select and the time picker; this adds the popup surface and the
// calendar. The public hooks are `--su3-comp-date-picker-*`.
export const datePickerStyles = [
  fieldFrame('date-picker'),
  css`
    .surface {
      position: fixed;
      inset: auto;
      box-sizing: border-box;
      display: none;
      max-block-size: calc(100% - 2 * ${sysVar('space-4')});
      margin: ${compVar('date-picker-offset', sysVar('space-1'))};
      padding: ${sysVar('space-4')};
      overflow-y: auto;
      border: ${sysVar('size-border-width')} solid ${sysVar('color-elevation-edge')};
      border-radius: ${compVar('date-picker-menu-shape', sysVar('shape-md'))};
      background-color: ${compVar('date-picker-menu-color', sysVar('color-surface-raised'))};
      box-shadow: ${compVar('date-picker-menu-elevation', sysVar('elevation-2'))};
      color: ${sysVar('color-text')};
    }

    .surface:popover-open {
      display: block;
      animation: date-picker-enter ${sysVar('motion-duration-fast')}
        ${sysVar('motion-easing-standard')};
    }

    @keyframes date-picker-enter {
      from {
        opacity: 0;
      }
    }

    /* The calendar: a header with the month and two buttons, then a grid of seven columns. */
    .calendar {
      display: flex;
      flex-direction: column;
      gap: ${sysVar('space-2')};
      inline-size: calc(${sysVar('size-control-md')} * 7);
      color: ${sysVar('color-text')};
      font-family: ${sysVar('typeface-sans')};
    }

    :host([inline]) {
      display: inline-block;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${sysVar('space-2')};
    }

    .title {
      flex: 1;
      text-align: center;
      font-size: ${sysVar('type-label-size')};
      font-weight: ${sysVar('type-title-weight')};
      line-height: ${sysVar('type-label-line-height')};
    }

    .nav,
    .day {
      position: relative;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: ${sysVar('size-control-md')};
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

    .nav::before,
    .day::before {
      ${stateLayerBox()}
    }

    .nav:hover:not(:disabled)::before,
    .day:hover:not([aria-disabled='true'])::before {
      ${stateLayerOpacity.hover}
    }

    .nav:focus-visible::before,
    .day:focus-visible::before {
      ${stateLayerOpacity.focus}
    }

    .nav:focus-visible,
    .day:focus-visible {
      ${focusRing('date-picker')}
    }

    .nav svg {
      inline-size: ${sysVar('size-icon-md')};
      block-size: ${sysVar('size-icon-md')};
    }

    /* The month arrows point the way the text runs. */
    :host(:dir(rtl)) .nav svg {
      transform: scaleX(-1);
    }

    .nav:disabled {
      cursor: default;
      color: color-mix(
        in srgb,
        ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
        transparent
      );
    }

    .grid {
      border-collapse: collapse;
      table-layout: fixed;
      inline-size: 100%;
    }

    .grid th {
      padding-block: ${sysVar('space-1')};
      color: ${sysVar('color-text-muted')};
      font-size: ${sysVar('type-caption-size')};
      font-weight: ${sysVar('type-label-weight')};
      line-height: ${sysVar('type-caption-line-height')};
      text-align: center;
    }

    .grid td {
      padding: 0;
      text-align: center;
    }

    .day[aria-current='date'] {
      box-shadow: inset 0 0 0 ${sysVar('size-border-width')}
        ${compVar('date-picker-today-color', sysVar('color-accent'))};
    }

    .day[aria-disabled='true'] {
      cursor: default;
      color: color-mix(
        in srgb,
        ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
        transparent
      );
    }

    td[aria-selected='true'] .day {
      background-color: ${compVar('date-picker-selected-color', sysVar('color-accent'))};
      color: ${compVar('date-picker-on-selected-color', sysVar('color-on-accent'))};
    }

    .calendar.disabled {
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .surface:popover-open {
        animation: none;
      }

      .nav::before,
      .day::before {
        transition: none;
      }
    }

    @media (forced-colors: active) {
      .surface {
        border-color: CanvasText;
      }

      .nav,
      .day {
        color: ButtonText;
      }

      td[aria-selected='true'] .day {
        background-color: Highlight;
        color: HighlightText;
      }

      .day[aria-current='date'] {
        box-shadow: inset 0 0 0 ${sysVar('size-border-width')} CanvasText;
      }

      .nav:focus-visible,
      .day:focus-visible {
        ${focusRingForcedColors}
      }

      .day[aria-disabled='true'],
      .nav:disabled {
        color: GrayText;
      }
    }
  `,
];
