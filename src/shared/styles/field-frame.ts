import { css, type CSSResult } from 'lit';
import { compVar, sysVar } from '../tokens/index.ts';
import { focusRing, focusRingForcedColors } from './focus-ring.ts';

/**
 * The frame of a field whose control is a button (select, date picker, time picker): a label above a
 * bordered container, with a line of supporting or error text below. The container is the
 * `<button class="container">` itself and holds a `.value` (or `.placeholder` look) and a
 * `.chevron`. Variants (`outlined`, `filled` through the host's `variant` attribute) and states
 * (`.invalid`, `.disabled` on `.field`) only change the private `--_*` properties; the public hooks
 * are `--su3-comp-{prefix}-*` (container color, border color, label color, error color, height,
 * container shape, text color, focus ring).
 *
 * @param prefix Component hook prefix, for example `select` for `--su3-comp-select-border-color`.
 */
export function fieldFrame(prefix: string): CSSResult {
  return css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .field {
      --_container: transparent;
      --_border: ${compVar(`${prefix}-border-color`, sysVar('color-border-strong'))};
      --_border-hover: ${sysVar('color-text')};
      --_label: ${compVar(`${prefix}-label-color`, sysVar('color-text-muted'))};
      --_support: ${sysVar('color-text-muted')};

      display: flex;
      flex-direction: column;
      gap: ${sysVar('space-1')};
      font-family: ${sysVar('typeface-sans')};
    }

    :host([variant='filled']) .field {
      --_container: ${compVar(`${prefix}-container-color`, sysVar('color-surface-sunken'))};
    }

    .field.invalid {
      --_border: ${compVar(`${prefix}-error-color`, sysVar('color-danger'))};
      --_border-hover: ${compVar(`${prefix}-error-color`, sysVar('color-danger'))};
      --_label: ${compVar(`${prefix}-error-color`, sysVar('color-danger'))};
      --_support: ${compVar(`${prefix}-error-color`, sysVar('color-danger'))};
    }

    .label {
      color: var(--_label);
      font-size: ${sysVar('type-label-size')};
      font-weight: ${sysVar('type-label-weight')};
      line-height: ${sysVar('type-label-line-height')};
    }

    .label[hidden] {
      display: none;
    }

    .required {
      margin-inline-start: ${sysVar('space-1')};
    }

    .container {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: ${sysVar('space-2')};
      inline-size: 100%;
      min-block-size: ${compVar(`${prefix}-height`, sysVar('size-control-lg'))};
      margin: 0;
      padding-block: 0;
      padding-inline: ${sysVar('space-4')};
      border: ${sysVar('size-border-width')} solid var(--_border);
      border-radius: ${compVar(`${prefix}-container-shape`, sysVar('shape-sm'))};
      background-color: var(--_container);
      color: ${compVar(`${prefix}-text-color`, sysVar('color-text'))};
      font: inherit;
      font-size: ${sysVar('type-body-size')};
      line-height: ${sysVar('type-body-line-height')};
      text-align: start;
      cursor: pointer;
      appearance: none;
      transition: border-color ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')};
    }

    :host([variant='filled']) .container {
      border-start-start-radius: ${compVar(`${prefix}-container-shape`, sysVar('shape-sm'))};
      border-start-end-radius: ${compVar(`${prefix}-container-shape`, sysVar('shape-sm'))};
      border-end-start-radius: 0;
      border-end-end-radius: 0;
      border-color: transparent;
      border-block-end-color: var(--_border);
    }

    .container:hover:not(:disabled) {
      --_border: var(--_border-hover);
    }

    .container:focus-visible {
      ${focusRing(prefix)}
    }

    .value {
      flex: 1;
      min-inline-size: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .value.placeholder {
      color: ${sysVar('color-text-muted')};
    }

    .chevron {
      flex: none;
      inline-size: ${sysVar('size-icon-md')};
      block-size: ${sysVar('size-icon-md')};
      color: var(--_label);
      transition: transform ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')};
    }

    /* Only the chevron of a list turns over; the icon of a picker stays as it is. */
    .container[aria-expanded='true'] .chevron.flip {
      transform: rotate(180deg);
    }

    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .supporting {
      min-block-size: ${sysVar('type-caption-line-height')};
      color: var(--_support);
      font-size: ${sysVar('type-caption-size')};
      line-height: ${sysVar('type-caption-line-height')};
    }

    .supporting[hidden] {
      display: none;
    }

    .field.disabled .label,
    .field.disabled .supporting,
    .field.disabled .container {
      color: color-mix(
        in srgb,
        ${sysVar('color-text')} calc(${sysVar('disabled-content-opacity')} * 100%),
        transparent
      );
    }

    .field.disabled .container {
      --_border: color-mix(
        in srgb,
        ${sysVar('color-text')} calc(${sysVar('disabled-container-opacity')} * 100%),
        transparent
      );
      --_container: transparent;
      cursor: default;
    }

    :host([variant='filled']) .field.disabled .container {
      --_container: color-mix(
        in srgb,
        ${sysVar('color-text')} calc(${sysVar('disabled-container-opacity')} * 100%),
        transparent
      );
    }

    .field.disabled .value.placeholder,
    .field.disabled .chevron {
      color: inherit;
    }

    @media (prefers-reduced-motion: reduce) {
      .container,
      .chevron {
        transition: none;
      }
    }

    @media (forced-colors: active) {
      .container {
        --_border: ButtonText;
      }

      .container:focus-visible {
        ${focusRingForcedColors}
      }

      .field.invalid .container {
        --_border: Highlight;
      }

      .field.disabled .container,
      .field.disabled .label,
      .field.disabled .supporting {
        --_border: GrayText;
        color: GrayText;
      }
    }
  `;
}
