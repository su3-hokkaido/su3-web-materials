import {
  html,
  LitElement,
  nothing,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { segmentStyles } from './segment.styles.ts';

/** Where the segment sits in its group; the group sets it to round the outer corners only. */
export type SegmentPosition = 'first' | 'middle' | 'last' | 'only';

/** Control sizes, set by the group: 32, 40 and 48px tall. */
export type SegmentSize = 'sm' | 'md' | 'lg';

/** How the group selects: one segment at a time (radio) or any number (toggle). */
export type SegmentSelectionMode = 'single' | 'multiple';

/**
 * One option of a `su3-segmented-button`. It renders a native button whose role follows the group:
 * a radio when only one segment can be selected, a toggle button (`aria-pressed`) when several can.
 * The group owns selection, sizing and keyboard navigation, so use a segment inside a group.
 *
 * Put the label in the default slot. A segment without visible text needs `aria-label` on the
 * segment. Give every segment a `value`: the group submits it with the form.
 *
 * @tagname su3-segment
 * @summary One selectable option of a segmented button.
 *
 * @slot - The label.
 *
 * @fires su3-segment-change - `selected` or `disabled` changed, for any reason. The group listens to
 * it to keep the roving tab stop and the form value current. Internal: it does not leave the group.
 *
 * @csspart control - The inner button.
 * @csspart label - The wrapper around the default slot.
 *
 * @cssprop [--su3-comp-segmented-button-container-color] - Background of an unselected segment.
 * @cssprop [--su3-comp-segmented-button-label-color] - Label color of an unselected segment.
 * @cssprop [--su3-comp-segmented-button-selected-container-color] - Background when selected.
 * @cssprop [--su3-comp-segmented-button-selected-label-color] - Label color when selected.
 * @cssprop [--su3-comp-segmented-button-border-color] - Border color.
 * @cssprop [--su3-comp-segmented-button-border-width=1px] - Border width.
 * @cssprop [--su3-comp-segmented-button-container-shape] - Radius of the group's outer corners.
 * @cssprop [--su3-comp-segmented-button-height] - Height.
 * @cssprop [--su3-comp-segmented-button-padding-inline] - Horizontal padding.
 * @cssprop [--su3-comp-segmented-button-focus-ring-color] - Focus indicator color.
 * @cssprop [--su3-comp-segmented-button-focus-ring-width] - Focus indicator thickness.
 * @cssprop [--su3-comp-segmented-button-focus-ring-offset] - Gap between the control and its focus ring.
 */
export class Su3Segment extends LitElement {
  static override styles = segmentStyles;

  /** Keeps `segment.focus()` working although the button is inside. */
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override properties: PropertyDeclarations = {
    value: {},
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    accessibleName: { attribute: 'aria-label' },
    size: { reflect: true },
    position: { reflect: true },
    selectionMode: { attribute: false },
    tabbable: { attribute: false },
    groupDisabled: { attribute: false },
  };

  /** The value the group submits while this segment is selected. */
  declare value: string;

  /** Whether the segment is selected. As an attribute it is the initial state (form reset). */
  declare selected: boolean;

  /** Disables this segment only; the group's `disabled` disables all of them. */
  declare disabled: boolean;

  /** The accessible name of the button, read from the host's `aria-label`. */
  declare accessibleName: string | null;

  /** Set by the group. */
  declare size: SegmentSize;

  /** Set by the group. */
  declare position: SegmentPosition;

  /** Set by the group: decides the role of the inner button. */
  declare selectionMode: SegmentSelectionMode;

  /** Set by the group: whether the button is in the tab order (roving tabindex). */
  declare tabbable: boolean;

  /** Set by the group. */
  declare groupDisabled: boolean;

  constructor() {
    super();
    this.value = '';
    this.selected = false;
    this.disabled = false;
    this.accessibleName = null;
    this.size = 'md';
    this.position = 'only';
    this.selectionMode = 'single';
    this.tabbable = true;
    this.groupDisabled = false;
  }

  /** Whether the segment ignores the user: disabled itself or through its group. */
  get isDisabled(): boolean {
    return this.disabled || this.groupDisabled;
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('selected') || changed.has('disabled')) {
      this.dispatchEvent(new Event('su3-segment-change', { bubbles: true }));
    }
  }

  protected override render(): TemplateResult {
    const single = this.selectionMode === 'single';
    return html`<button
      class="control"
      part="control"
      type="button"
      role=${single ? 'radio' : nothing}
      aria-checked=${single ? String(this.selected) : nothing}
      aria-pressed=${single ? nothing : String(this.selected)}
      aria-label=${this.accessibleName ?? nothing}
      tabindex=${this.tabbable ? '0' : '-1'}
      ?disabled=${this.isDisabled}
    >
      <svg class="check" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
      </svg>
      <span class="label" part="label"><slot></slot></span>
    </button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-segment': Su3Segment;
  }
}
