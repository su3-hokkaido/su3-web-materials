import { css } from 'lit';

// The visual design lives in the segments (`su3-segment`), which read the
// `--su3-comp-segmented-button-*` hooks; the group only lays them out in one connected row.
export const segmentedButtonStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  .group {
    display: inline-flex;
  }
`;
