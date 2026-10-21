import { css } from 'lit';
import { focusRing, focusRingForcedColors } from '../../../styles/index.ts';
import { compVar, sysVar } from '../../../tokens/index.ts';

// Layout: a label above a container (leading slot, the native input, trailing slot) and a line of
// supporting or error text below. Variants and states only change the private `--_*` properties;
// the public hooks are `--su3-comp-text-field-*` (see the @cssprop list on Su3TextField).
export const textFieldStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  .field {
    --_container: transparent;
    --_border: ${compVar('text-field-border-color', sysVar('color-border-strong'))};
    --_border-hover: ${sysVar('color-text')};
    --_label: ${compVar('text-field-label-color', sysVar('color-text-muted'))};
    --_support: ${sysVar('color-text-muted')};

    display: flex;
    flex-direction: column;
    gap: ${sysVar('space-1')};
    font-family: ${sysVar('typeface-sans')};
  }

  :host([variant='filled']) .field {
    --_container: ${compVar('text-field-container-color', sysVar('color-surface-sunken'))};
  }

  .field.invalid {
    --_border: ${compVar('text-field-error-color', sysVar('color-danger'))};
    --_border-hover: ${compVar('text-field-error-color', sysVar('color-danger'))};
    --_label: ${compVar('text-field-error-color', sysVar('color-danger'))};
    --_support: ${compVar('text-field-error-color', sysVar('color-danger'))};
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
    min-height: ${compVar('text-field-height', sysVar('size-control-lg'))};
    padding-inline: ${compVar('text-field-padding-inline', sysVar('space-4'))};
    border: ${sysVar('size-border-width')} solid var(--_border);
    border-radius: ${compVar('text-field-container-shape', sysVar('shape-sm'))};
    background-color: var(--_container);
    color: ${compVar('text-field-text-color', sysVar('color-text'))};
    cursor: text;
    transition: border-color ${sysVar('motion-duration-fast')} ${sysVar('motion-easing-standard')};
  }

  :host([variant='filled']) .container {
    border-start-start-radius: ${compVar('text-field-container-shape', sysVar('shape-sm'))};
    border-start-end-radius: ${compVar('text-field-container-shape', sysVar('shape-sm'))};
    border-end-start-radius: 0;
    border-end-end-radius: 0;
    border-color: transparent;
    border-block-end-color: var(--_border);
  }

  .container:hover {
    --_border: var(--_border-hover);
  }

  .container:has(.input:focus-visible) {
    ${focusRing('text-field')}
  }

  slot[name='leading']::slotted(*),
  slot[name='trailing']::slotted(*) {
    flex: none;
    width: ${sysVar('size-icon-md')};
    height: ${sysVar('size-icon-md')};
    color: var(--_label);
  }

  .input {
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: ${sysVar('type-body-size')};
    line-height: ${sysVar('type-body-line-height')};
  }

  .input::placeholder {
    color: ${sysVar('color-text-muted')};
    opacity: 1;
  }

  .supporting {
    min-height: ${sysVar('type-caption-line-height')};
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

  .field.disabled .input::placeholder {
    color: inherit;
  }

  @media (prefers-reduced-motion: reduce) {
    .container {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .container {
      --_border: ButtonText;
    }

    .container:has(.input:focus-visible) {
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
