import { css } from 'lit';
import { compVar, sysVar } from '../../../tokens/index.ts';

// Private custom properties (`--_*`) carry the per-variant defaults. The public hooks are
// `--su3-comp-card-*`, which win over those defaults when set (see the @cssprop list on Su3Card).
export const cardStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  .card {
    /* Defaults: the elevated variant. */
    --_container: ${sysVar('color-surface-raised')};
    --_border: ${sysVar('color-elevation-edge')};
    --_elevation: ${sysVar('elevation-1')};

    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: ${compVar('card-gap', sysVar('space-3'))};
    padding-block-end: ${compVar('card-padding', sysVar('space-4'))};
    overflow: hidden;
    border: ${compVar('card-border-width', sysVar('size-border-width'))} solid
      ${compVar('card-border-color', 'var(--_border)')};
    border-radius: ${compVar('card-container-shape', sysVar('shape-md'))};
    background-color: ${compVar('card-container-color', 'var(--_container)')};
    box-shadow: ${compVar('card-elevation', 'var(--_elevation)')};
    color: ${compVar('card-text-color', sysVar('color-text'))};
    font-family: ${sysVar('typeface-sans')};
    font-size: ${sysVar('type-body-size')};
    line-height: ${sysVar('type-body-line-height')};
  }

  :host([variant='filled']) .card {
    --_container: ${sysVar('color-surface-sunken')};
    --_border: transparent;
    --_elevation: ${sysVar('elevation-0')};
  }

  :host([variant='outlined']) .card {
    --_container: transparent;
    --_border: ${sysVar('color-border')};
    --_elevation: ${sysVar('elevation-0')};
  }

  .media[hidden],
  .header[hidden],
  .body[hidden],
  .actions[hidden] {
    display: none;
  }

  /* Media is full-bleed: the card's overflow and corners clip it. */
  slot[name='media']::slotted(*) {
    display: block;
    width: 100%;
  }

  .header,
  .body,
  .actions {
    padding-inline: ${compVar('card-padding', sysVar('space-4'))};
  }

  .header {
    font-weight: ${sysVar('type-label-weight')};
  }

  /* Without media the first area needs the top padding that the media would otherwise replace. */
  .card.no-media {
    padding-block-start: ${compVar('card-padding', sysVar('space-4'))};
  }

  /* A card with only media has no text areas, so the bottom padding would be an empty strip. */
  .card.media-only {
    padding-block-end: 0;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: ${sysVar('space-2')};
  }

  /* Shadows are not drawn in forced colors, so every variant keeps a visible edge. */
  @media (forced-colors: active) {
    .card {
      border-color: CanvasText;
    }
  }
`;
