import { css } from 'lit';
import { compVar, sysVar } from '../../../tokens/index.ts';

// Private custom properties (`--_*`) carry the per-tone defaults. The public hooks are
// `--su3-comp-badge-*`, which win over those defaults when set (see the @cssprop list on Su3Badge).
export const badgeStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  .badge {
    /* Defaults: the accent tone. */
    --_container: ${sysVar('color-accent')};
    --_label: ${sysVar('color-on-accent')};
    --_border: transparent;

    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: ${compVar('badge-height', sysVar('space-5'))};
    min-width: ${compVar('badge-height', sysVar('space-5'))};
    padding-inline: ${compVar('badge-padding-inline', sysVar('space-2'))};
    border: ${sysVar('size-border-width')} solid ${compVar('badge-border-color', 'var(--_border)')};
    border-radius: ${compVar('badge-container-shape', sysVar('shape-pill'))};
    background-color: ${compVar('badge-container-color', 'var(--_container)')};
    color: ${compVar('badge-label-color', 'var(--_label)')};
    font-family: ${sysVar('typeface-sans')};
    font-size: ${compVar('badge-font-size', sysVar('type-label-sm-size'))};
    font-weight: ${sysVar('type-label-sm-weight')};
    line-height: ${sysVar('type-label-sm-line-height')};
    white-space: nowrap;
  }

  :host([tone='subtle']) .badge {
    --_container: ${sysVar('color-accent-subtle')};
    --_label: ${sysVar('color-on-accent-subtle')};
  }

  :host([tone='danger']) .badge {
    --_container: ${sysVar('color-danger')};
    --_label: ${sysVar('color-on-danger')};
  }

  :host([tone='neutral']) .badge {
    --_container: ${sysVar('color-surface-sunken')};
    --_label: ${sysVar('color-text-muted')};
    --_border: ${sysVar('color-border')};
  }

  /* A dot has no text to carry its meaning, so the neutral one needs a fill that is visible
     against the surface (the pill's sunken tint is not). */
  :host([tone='neutral']) .badge.dot {
    --_container: ${sysVar('color-text-muted')};
    --_border: transparent;
  }

  .badge.dot {
    width: ${compVar('badge-dot-size', sysVar('space-2'))};
    height: ${compVar('badge-dot-size', sysVar('space-2'))};
    min-width: 0;
    padding: 0;
  }

  /* Backgrounds are replaced in forced colors, so the shape is kept by the border and a dot by a fill. */
  @media (forced-colors: active) {
    .badge {
      border-color: CanvasText;
    }

    .badge.dot {
      background-color: CanvasText;
    }
  }
`;
