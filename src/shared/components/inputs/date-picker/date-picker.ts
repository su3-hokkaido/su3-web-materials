import {
  html,
  nothing,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import {
  addDays,
  addMonths,
  clampDate,
  compareDates,
  firstDayOfWeekFor,
  resolveLocale,
  formatIsoDate,
  isSameDate,
  monthGrid,
  parseIsoDate,
  today,
  weekdayOf,
  type CalendarDate,
  type Weekday,
} from '../../../behaviors/calendar-date.ts';
import {
  FormAssociatedElement,
  type FormRestoreState,
} from '../../../behaviors/form-associated.ts';
import { PopupController } from '../../../behaviors/popup-controller.ts';
import type { PopupPlacement } from '../../../behaviors/popup-position.ts';
import { datePickerStyles } from './date-picker.styles.ts';

/** The look of the field: a border around the container, or a tinted container with a line below. */
export type DatePickerVariant = 'outlined' | 'filled';

const CHEVRON_LEFT = 'M15 6l-6 6 6 6';
const CHEVRON_RIGHT = 'M9 6l6 6-6 6';

/**
 * A form-associated date control. The label sits above a button that shows the chosen date; it opens a
 * calendar below the field (above when there is no room). With `inline` the calendar is shown on its
 * own, without the field and the popup.
 *
 * `value` is an ISO calendar date (`YYYY-MM-DD`), empty when nothing is chosen; `min` and `max` limit
 * the choice in the same format. The calendar shows one month with a heading and two buttons that
 * change the month, the weekdays and a grid of days. Keyboard in the grid: the arrow keys move by day
 * and week, Home and End to the first and last day of the week, PageUp and PageDown by month (with
 * Shift by year), Enter and Space choose; Escape closes the popup and returns focus to the button.
 * Days outside `min` and `max` are shown but cannot be chosen, and the movement stays inside the
 * range. Choosing a date fires `input` and then `change`.
 *
 * Names and formats follow `locale` (default: the document language, else the browser's);
 * `first-day-of-week` (0 for Sunday to 6) overrides the locale's first day. Dates are calendar dates
 * without a time or time zone, and "today" is the user's local date. `required` gives `valueMissing`,
 * `min` and `max` give `rangeUnderflow` and `rangeOverflow`; the error shows after the user leaves
 * the field or a submit fails, or whenever `error-text` is set. A form reset returns to the `value`
 * attribute, and a state restore applies the saved value. For a field without a visible label use
 * `aria-label` on the host. Ranges, typing a date and non-Gregorian calendars are not supported.
 *
 * @tagname su3-date-picker
 * @summary A form-associated date control with a calendar popup.
 *
 * @csspart field - The wrapper around label, container and supporting text.
 * @csspart label - The label.
 * @csspart container - The button that shows the chosen date.
 * @csspart surface - The popup that holds the calendar.
 * @csspart calendar - The calendar.
 * @csspart supporting-text - The supporting or error text.
 *
 * @cssprop [--su3-comp-date-picker-container-color] - Background of the filled variant.
 * @cssprop [--su3-comp-date-picker-border-color] - Border color.
 * @cssprop [--su3-comp-date-picker-text-color] - Text color.
 * @cssprop [--su3-comp-date-picker-label-color] - Label color.
 * @cssprop [--su3-comp-date-picker-error-color] - Color of the invalid state.
 * @cssprop [--su3-comp-date-picker-height] - Minimum height of the container.
 * @cssprop [--su3-comp-date-picker-container-shape] - Corner radius of the container.
 * @cssprop [--su3-comp-date-picker-menu-color] - Background of the popup.
 * @cssprop [--su3-comp-date-picker-menu-shape] - Corner radius of the popup.
 * @cssprop [--su3-comp-date-picker-menu-elevation] - Box shadow of the popup.
 * @cssprop [--su3-comp-date-picker-offset] - Gap between the container and the popup.
 * @cssprop [--su3-comp-date-picker-selected-color] - Background of the chosen day.
 * @cssprop [--su3-comp-date-picker-on-selected-color] - Text color of the chosen day.
 * @cssprop [--su3-comp-date-picker-today-color] - Outline color of today.
 * @cssprop [--su3-comp-date-picker-focus-ring-color] - Focus indicator color.
 *
 * @fires input - The user chose a date.
 * @fires change - The user chose a date (after `input`).
 */
export class Su3DatePicker extends FormAssociatedElement {
  static override styles = datePickerStyles;

  static override properties: PropertyDeclarations = {
    variant: { reflect: true },
    label: {},
    supportingText: { attribute: 'supporting-text' },
    errorText: { attribute: 'error-text' },
    placeholder: {},
    required: { type: Boolean, reflect: true },
    min: {},
    max: {},
    locale: {},
    firstDayOfWeek: { type: Number, attribute: 'first-day-of-week' },
    inline: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
    previousLabel: { attribute: 'previous-label' },
    nextLabel: { attribute: 'next-label' },
    touched: { state: true },
    focused: { state: true },
  };

  /** The look of the field. */
  declare variant: DatePickerVariant;

  /** The visible label, shown above the button. */
  declare label: string;

  /** Help shown under the field while there is no error. */
  declare supportingText: string;

  /** An error shown under the field whatever the validity; empty to use the validation message. */
  declare errorText: string;

  /** Shown in the button while no date is chosen. */
  declare placeholder: string;

  /** Makes an empty date invalid. */
  declare required: boolean;

  /** The earliest date that can be chosen, `YYYY-MM-DD`. */
  declare min: string;

  /** The latest date that can be chosen, `YYYY-MM-DD`. */
  declare max: string;

  /** The BCP 47 language tag for names and formats. Empty uses the document language. */
  declare locale: string;

  /** The first day of the week, 0 (Sunday) to 6. `undefined` uses the locale's. */
  declare firstDayOfWeek: number | undefined;

  /** Shows the calendar on its own, without the field and the popup. */
  declare inline: boolean;

  /** Whether the popup is shown. Ignored when `inline`. */
  declare open: boolean;

  /** The accessible name of the button that goes to the previous month. */
  declare previousLabel: string;

  /** The accessible name of the button that goes to the next month. */
  declare nextLabel: string;

  /** Whether the user has left the field or a submit failed; errors are shown only afterwards. */
  declare touched: boolean;

  /** The date that has the grid's tab stop and decides which month is shown. */
  declare private focused: CalendarDate;

  #initialValue = '';
  readonly #popup: PopupController = new PopupController(this, {
    surface: (): HTMLElement | null => this.renderRoot.querySelector<HTMLElement>('.surface'),
    anchor: (): Element | null => this.renderRoot.querySelector('.container'),
    placement: (): PopupPlacement => ({ side: 'bottom', align: 'start' }),
    onOutsidePress: () => {
      this.#close(false);
    },
  });

  constructor() {
    super();
    this.variant = 'outlined';
    this.label = '';
    this.supportingText = '';
    this.errorText = '';
    this.placeholder = '';
    this.required = false;
    this.min = '';
    this.max = '';
    this.locale = '';
    this.firstDayOfWeek = undefined;
    this.inline = false;
    this.open = false;
    this.previousLabel = 'Previous month';
    this.nextLabel = 'Next month';
    this.touched = false;
    this.focused = today();
    // A failed submit or checkValidity() fires `invalid`; show the error from then on.
    this.addEventListener('invalid', () => {
      this.touched = true;
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // The `value` attribute is also what a form reset returns to.
    if (this.#initialValue === '' && this.hasAttribute('value')) {
      this.#initialValue = this.getAttribute('value') ?? '';
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Removing the element hides the popup, so the state follows it.
    this.open = false;
  }

  /** The chosen date, or `null` when `value` is empty or not a date. */
  #chosen(): CalendarDate | null {
    return parseIsoDate(this.value);
  }

  #minDate(): CalendarDate | null {
    return parseIsoDate(this.min);
  }

  #maxDate(): CalendarDate | null {
    return parseIsoDate(this.max);
  }

  #language(): string {
    return resolveLocale(this.locale || document.documentElement.lang);
  }

  #firstDay(): Weekday {
    const set = this.firstDayOfWeek;
    if (set !== undefined && Number.isInteger(set) && set >= 0 && set <= 6) return set as Weekday;
    return firstDayOfWeekFor(this.#language());
  }

  #inRange(date: CalendarDate): boolean {
    const min = this.#minDate();
    const max = this.#maxDate();
    return (!min || compareDates(date, min) >= 0) && (!max || compareDates(date, max) <= 0);
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has('value') || changed.has('min') || changed.has('max')) {
      // The tab stop and the month shown follow the value, and stay inside the range.
      this.focused = clampDate(this.#chosen() ?? this.focused, this.#minDate(), this.#maxDate());
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('value')) {
      this.internals.setFormValue(this.#chosen() ? this.value : null, this.value);
    }
    this.revalidate();
    if (this.inline) return;
    if (this.#popup.sync(this.open && !this.isDisabled)) {
      // Opening starts on the chosen day, else today, kept inside the range.
      this.focused = clampDate(this.#chosen() ?? today(), this.#minDate(), this.#maxDate());
      void this.updateComplete.then(() => {
        this.#focusDay();
      });
    }
  }

  protected override revalidate(): void {
    const chosen = this.#chosen();
    const min = this.#minDate();
    const max = this.#maxDate();
    const container = this.renderRoot.querySelector<HTMLElement>('.container');
    this.setValidityState(
      {
        valueMissing: this.required && this.value === '',
        badInput: this.value !== '' && !chosen,
        rangeUnderflow: chosen !== null && min !== null && compareDates(chosen, min) < 0,
        rangeOverflow: chosen !== null && max !== null && compareDates(chosen, max) > 0,
      },
      this.value === '' ? 'Please choose a date.' : 'This date is not allowed.',
      container ?? undefined,
    );
  }

  protected override resetFormState(): void {
    this.value = this.#initialValue;
    this.touched = false;
  }

  protected override restoreFormState(state: FormRestoreState): void {
    if (typeof state === 'string') this.value = state;
  }

  #focusDay(): void {
    this.renderRoot.querySelector<HTMLElement>('.day[tabindex="0"]')?.focus();
  }

  #close(returnFocus: boolean): void {
    if (!this.open) return;
    this.open = false;
    if (returnFocus) this.renderRoot.querySelector<HTMLElement>('.container')?.focus();
  }

  #choose(date: CalendarDate): void {
    if (!this.#inRange(date) || this.isDisabled) return;
    const iso = formatIsoDate(date);
    const changed = iso !== this.value;
    this.value = iso;
    this.focused = date;
    if (changed) {
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (!this.inline) this.#close(true);
  }

  #supportingMessage(): { text: string; invalid: boolean } {
    if (this.errorText !== '') return { text: this.errorText, invalid: true };
    if (this.touched && !this.validity.valid) {
      return { text: this.validationMessage, invalid: true };
    }
    return { text: this.supportingText, invalid: false };
  }

  /** Moves the shown month and the tab stop by months; the focus stays where it is. */
  #stepMonth(months: number): void {
    this.focused = clampDate(addMonths(this.focused, months), this.#minDate(), this.#maxDate());
  }

  #onGridKeyDown = (event: KeyboardEvent): void => {
    const rtl = getComputedStyle(this).direction === 'rtl';
    const first = this.#firstDay();
    const current = this.focused;
    let next: CalendarDate | undefined;
    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(current, rtl ? 1 : -1);
        break;
      case 'ArrowRight':
        next = addDays(current, rtl ? -1 : 1);
        break;
      case 'ArrowUp':
        next = addDays(current, -7);
        break;
      case 'ArrowDown':
        next = addDays(current, 7);
        break;
      case 'Home':
        next = addDays(current, -((weekdayOf(current) - first + 7) % 7));
        break;
      case 'End':
        next = addDays(current, 6 - ((weekdayOf(current) - first + 7) % 7));
        break;
      case 'PageUp':
        next = addMonths(current, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addMonths(current, event.shiftKey ? 12 : 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    this.focused = clampDate(next, this.#minDate(), this.#maxDate());
    void this.updateComplete.then(() => {
      this.#focusDay();
    });
  };

  #onSurfaceKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.#close(true);
    }
  };

  #onFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget;
    if (next instanceof Node && (this.renderRoot.contains(next) || this.contains(next))) return;
    // Without a related target (a press on something that cannot take focus, which Safari also does
    // for buttons) the popup is left alone: a press outside is handled by the popup controller.
    if (next !== null && this.open) this.#close(false);
    if (!this.open) this.touched = true;
  };

  #onTriggerClick = (): void => {
    if (this.isDisabled) return;
    this.open = !this.open;
  };

  #onTriggerKeyDown = (event: KeyboardEvent): void => {
    if (this.open) {
      if (event.key === 'Escape') this.#close(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.open = true;
    }
  };

  #renderCalendar(): TemplateResult {
    const language = this.#language();
    const first = this.#firstDay();
    const { year, month } = this.focused;
    const weeks = monthGrid(year, month, first);
    const chosen = this.#chosen();
    const now = today();
    const min = this.#minDate();
    const max = this.#maxDate();
    const title = new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric' }).format(
      new Date(year, month - 1, 1),
    );
    const weekdayShort = new Intl.DateTimeFormat(language, { weekday: 'short' });
    const weekdayLong = new Intl.DateTimeFormat(language, { weekday: 'long' });
    const dayLong = new Intl.DateTimeFormat(language, { dateStyle: 'full' });
    // 2023-01-01 is a Sunday: the reference for the weekday names.
    const names = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(2023, 0, 1 + ((first + index) % 7));
      return { short: weekdayShort.format(date), long: weekdayLong.format(date) };
    });
    const monthStart: CalendarDate = { year, month, day: 1 };
    const prevDisabled = this.isDisabled || (min !== null && compareDates(monthStart, min) <= 0);
    const monthEnd = addDays(addMonths(monthStart, 1), -1);
    const nextDisabled = this.isDisabled || (max !== null && compareDates(monthEnd, max) >= 0);
    const label = this.label || this.accessibleName;

    return html`<div
      class=${this.isDisabled ? 'calendar disabled' : 'calendar'}
      part="calendar"
      role="group"
      aria-label=${label ?? nothing}
    >
      <div class="header">
        <button
          class="nav"
          type="button"
          aria-label=${this.previousLabel}
          ?disabled=${prevDisabled}
          @click=${() => {
            this.#stepMonth(-1);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d=${CHEVRON_LEFT} />
          </svg>
        </button>
        <div class="title" id="title" aria-live="polite">${title}</div>
        <button
          class="nav"
          type="button"
          aria-label=${this.nextLabel}
          ?disabled=${nextDisabled}
          @click=${() => {
            this.#stepMonth(1);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d=${CHEVRON_RIGHT} />
          </svg>
        </button>
      </div>
      <table class="grid" role="grid" aria-labelledby="title">
        <thead>
          <tr>
            ${names.map(
              (name) =>
                html`<th scope="col" abbr=${name.long} aria-label=${name.long}>${name.short}</th>`,
            )}
          </tr>
        </thead>
        <tbody @keydown=${this.#onGridKeyDown}>
          ${weeks.map(
            (week) =>
              html`<tr>
                ${week.map((date) => {
                  if (date.month !== month) return html`<td aria-hidden="true"></td>`;
                  const selected = isSameDate(date, chosen);
                  const disabled = !this.#inRange(date) || this.isDisabled;
                  return html`<td role="gridcell" aria-selected=${selected ? 'true' : 'false'}>
                    <button
                      class="day"
                      type="button"
                      tabindex=${isSameDate(date, this.focused) ? '0' : '-1'}
                      aria-label=${dayLong.format(new Date(date.year, date.month - 1, date.day))}
                      aria-current=${isSameDate(date, now) ? 'date' : nothing}
                      aria-disabled=${disabled ? 'true' : nothing}
                      @click=${() => {
                        this.#choose(date);
                      }}
                    >
                      ${date.day}
                    </button>
                  </td>`;
                })}
              </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
  }

  protected override render(): TemplateResult {
    if (this.inline) return this.#renderCalendar();
    const { text, invalid } = this.#supportingMessage();
    const chosen = this.#chosen();
    const shown = chosen
      ? new Intl.DateTimeFormat(this.#language(), { dateStyle: 'medium' }).format(
          new Date(chosen.year, chosen.month - 1, chosen.day),
        )
      : this.placeholder;
    const hasLabel = this.label !== '';
    const classes = ['field', invalid ? 'invalid' : '', this.isDisabled ? 'disabled' : '']
      .filter(Boolean)
      .join(' ');
    return html`<div class=${classes} part="field" @focusout=${this.#onFocusOut}>
      <span class="label" id="label" part="label" ?hidden=${!hasLabel}
        >${this.label}${
          this.required
            ? html`<span class="required" aria-hidden="true">*</span
                ><span class="sr-only">, required</span>`
            : nothing
        }</span
      >
      <span id="name" hidden>${hasLabel ? '' : (this.accessibleName ?? '')}</span>
      <button
        class="container"
        part="container"
        type="button"
        aria-haspopup="dialog"
        aria-expanded=${String(this.open)}
        aria-labelledby=${hasLabel ? 'label value' : this.accessibleName ? 'name value' : 'value'}
        aria-describedby=${text === '' ? nothing : 'supporting'}
        ?disabled=${this.isDisabled}
        @click=${this.#onTriggerClick}
        @keydown=${this.#onTriggerKeyDown}
      >
        <span class=${chosen ? 'value' : 'value placeholder'} id="value">${shown}</span>
        <svg
          class="chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 6h14v14H5zM5 10h14M9 3v4M15 3v4" />
        </svg>
      </button>
      <div
        class="surface"
        part="surface"
        role="dialog"
        popover="manual"
        aria-label=${hasLabel ? this.label : (this.accessibleName ?? 'Choose date')}
        @keydown=${this.#onSurfaceKeyDown}
      >
        ${this.#renderCalendar()}
      </div>
      <div
        id="supporting"
        class="supporting"
        part="supporting-text"
        aria-live="polite"
        ?hidden=${text === ''}
      >
        ${text}
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'su3-date-picker': Su3DatePicker;
  }
}
