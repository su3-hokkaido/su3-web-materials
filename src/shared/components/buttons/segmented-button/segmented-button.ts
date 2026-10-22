import {
  html,
  nothing,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { FormAssociatedElement, type FormRestoreState } from '../../../behaviors/index.ts';
import type { Su3Segment, SegmentSize } from '../segment/segment.ts';
import { segmentedButtonStyles } from './segmented-button.styles.ts';

function sameValues(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * A connected row of `su3-segment` options. By default exactly one can be selected (radio
 * semantics: Arrow keys move and select, only one segment is a tab stop); with `multiple` any number
 * can be (toggle buttons announced with `aria-pressed`, each one a tab stop).
 *
 * Put the segments in the default slot and give each a `value`. Mark the initially selected ones
 * with the `selected` attribute; a form reset returns to that state. The group is form-associated: in
 * single mode it submits `name=value` of the selected segment, in multiple mode one entry per
 * selected segment, and `required` makes it invalid while nothing is selected. Name the group with
 * `aria-label` on the host (`aria-labelledby` cannot cross the shadow boundary). `input` and `change` fire on the group when the user changes the
 * selection.
 *
 * @tagname su3-segmented-button
 * @summary A connected row of options where one (or several) can be selected.
 *
 * @slot - The `su3-segment` options.
 *
 * @csspart group - The element that carries the group role.
 *
 * The same `--su3-comp-segmented-button-*` hooks are read by every `su3-segment`; set them on the
 * group to theme all segments at once. The most common ones are listed here, the complete list is on
 * `su3-segment`.
 *
 * @cssprop [--su3-comp-segmented-button-container-color] - Background of an unselected segment.
 * @cssprop [--su3-comp-segmented-button-selected-container-color] - Background of a selected segment.
 * @cssprop [--su3-comp-segmented-button-border-color] - Border color.
 * @cssprop [--su3-comp-segmented-button-container-shape] - Radius of the outer corners.
 * @cssprop [--su3-comp-segmented-button-height] - Height of every segment.
 *
 * @fires input - The user changed the selection.
 * @fires change - The user changed the selection.
 */
export class Su3SegmentedButton extends FormAssociatedElement {
  static override styles = segmentedButtonStyles;

  static override properties: PropertyDeclarations = {
    multiple: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    size: { reflect: true },
    values: { attribute: false },
  };

  /** Lets the user select several segments instead of exactly one. */
  declare multiple: boolean;

  /** The group is invalid while no segment is selected. */
  declare required: boolean;

  /** Control size, applied to every segment. */
  declare size: SegmentSize;

  /**
   * The selected values in `multiple` mode. In single mode use `value`, which holds the selected
   * segment's value (an empty string when nothing is selected).
   */
  declare values: string[];

  /** Selected values at the first `slotchange`; a form reset returns to them. */
  #initial: string[] = [];
  #initialized = false;

  constructor() {
    super();
    this.multiple = false;
    this.required = false;
    this.size = 'md';
    this.values = [];
  }

  #segments(): Su3Segment[] {
    return [...this.children].filter(
      (child): child is Su3Segment => child.localName === 'su3-segment',
    );
  }

  #selectedValues(): string[] {
    const selected = this.#segments().filter((segment) => segment.selected);
    return (this.multiple ? selected : selected.slice(0, 1)).map((segment) => segment.value);
  }

  /** Selects the segments with these values (the first match only in single mode). */
  #setSelection(values: readonly string[]): void {
    let taken = false;
    for (const segment of this.#segments()) {
      const match: boolean = values.includes(segment.value) && (this.multiple || !taken);
      segment.selected = match;
      taken ||= match;
    }
    const selected = this.#selectedValues();
    if (this.multiple) {
      if (!sameValues(selected, this.values)) this.values = selected;
    } else {
      this.value = selected[0] ?? '';
    }
  }

  /** Positions, sizes and roving tabindex: pushed to the segments after every change. */
  #sync(): void {
    const segments = this.#segments();
    const enabled = segments.filter((segment) => !segment.disabled && !this.isDisabled);
    const tabStop = enabled.find((segment) => segment.selected) ?? enabled[0];
    segments.forEach((segment, index) => {
      segment.selectionMode = this.multiple ? 'multiple' : 'single';
      segment.size = this.size;
      segment.groupDisabled = this.isDisabled;
      segment.tabbable = this.multiple || segment === tabStop;
      segment.position =
        segments.length === 1
          ? 'only'
          : index === 0
            ? 'first'
            : index === segments.length - 1
              ? 'last'
              : 'middle';
    });
  }

  #updateFormValue(): void {
    const selected = this.#selectedValues();
    if (this.multiple) {
      if (this.name === '' || selected.length === 0) {
        this.internals.setFormValue(null, '[]');
      } else {
        const data = new FormData();
        for (const value of selected) data.append(this.name, value);
        this.internals.setFormValue(data, JSON.stringify(selected));
      }
    } else {
      const [value] = selected;
      this.internals.setFormValue(
        value !== undefined && this.name !== '' ? value : null,
        value ?? '',
      );
    }
    this.revalidate();
  }

  protected override revalidate(): void {
    const missing = this.required && this.#selectedValues().length === 0;
    this.setValidityState(
      { valueMissing: missing },
      missing ? 'Please select an item in the list.' : '',
      this.#segments()[0],
    );
  }

  protected override resetFormState(): void {
    this.#setSelection(this.#initial);
    this.#updateFormValue();
  }

  protected override restoreFormState(state: FormRestoreState): void {
    if (typeof state !== 'string') return;
    if (this.multiple) {
      try {
        const parsed: unknown = JSON.parse(state);
        if (Array.isArray(parsed)) this.#setSelection(parsed.map(String));
      } catch {
        return;
      }
    } else {
      this.#setSelection(state === '' ? [] : [state]);
    }
    this.#updateFormValue();
  }

  protected override willUpdate(changed: PropertyValues): void {
    // Selection set from outside is applied here, so the derived value does not cost a second update.
    if (!this.#initialized) return;
    if (changed.has('value') && !this.multiple) {
      this.#setSelection(this.value === '' ? [] : [this.value]);
    } else if (changed.has('values') && this.multiple) {
      this.#setSelection(this.values);
    } else if (changed.has('multiple')) {
      this.#setSelection(this.#selectedValues());
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.#sync();
    this.#updateFormValue();
  }

  #onSlotChange = (): void => {
    if (!this.#initialized) {
      this.#initialized = true;
      // A value set before the segments existed wins over their `selected` attributes.
      const preset = this.multiple ? this.values : this.value === '' ? [] : [this.value];
      this.#setSelection(preset.length > 0 ? preset : this.#selectedValues());
      this.#initial = this.#selectedValues();
    } else {
      this.#setSelection(this.#selectedValues());
    }
    this.#sync();
    this.#updateFormValue();
  };

  #select(segment: Su3Segment): void {
    if (segment.isDisabled) return;
    if (this.multiple) {
      this.#setSelection(
        segment.selected
          ? this.#selectedValues().filter((value) => value !== segment.value)
          : [...this.#selectedValues(), segment.value],
      );
    } else if (!segment.selected) {
      this.#setSelection([segment.value]);
    } else {
      return;
    }
    this.#sync();
    this.#updateFormValue();
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #segmentOf(event: Event): Su3Segment | undefined {
    return event
      .composedPath()
      .find(
        (node): node is Su3Segment => node instanceof Element && node.localName === 'su3-segment',
      );
  }

  #onClick = (event: Event): void => {
    const segment = this.#segmentOf(event);
    if (segment) this.#select(segment);
  };

  /** A segment's `selected` or `disabled` changed outside the group's own methods. */
  #onSegmentChange = (): void => {
    this.#sync();
    this.#updateFormValue();
  };

  #onKeydown = (event: KeyboardEvent): void => {
    if (this.multiple) return;
    // The row runs right to left in RTL, so the horizontal arrows swap.
    const forward = getComputedStyle(this).direction === 'rtl' ? -1 : 1;
    const keys: Record<string, number> = {
      ArrowRight: forward,
      ArrowDown: 1,
      ArrowLeft: -forward,
      ArrowUp: -1,
    };
    const current = this.#segmentOf(event);
    const enabled = this.#segments().filter((segment) => !segment.isDisabled);
    if (!current || enabled.length === 0) return;
    let next: Su3Segment | undefined;
    if (event.key === 'Home') next = enabled[0];
    else if (event.key === 'End') next = enabled[enabled.length - 1];
    else if (event.key in keys) {
      const index = enabled.indexOf(current);
      const step = keys[event.key] ?? 0;
      next = enabled[(index + step + enabled.length) % enabled.length];
    }
    if (!next) return;
    event.preventDefault();
    next.focus();
    this.#select(next);
  };

  protected override render(): TemplateResult {
    return html`<div
      class="group"
      part="group"
      role=${this.multiple ? 'group' : 'radiogroup'}
      aria-label=${this.accessibleName ?? nothing}
      aria-required=${!this.multiple && this.required ? 'true' : nothing}
      aria-disabled=${this.isDisabled ? 'true' : nothing}
      @click=${this.#onClick}
      @keydown=${this.#onKeydown}
      @su3-segment-change=${this.#onSegmentChange}
    >
      <slot @slotchange=${this.#onSlotChange}></slot>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-segmented-button': Su3SegmentedButton;
  }
}
