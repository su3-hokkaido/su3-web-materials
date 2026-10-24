import {
  html,
  nothing,
  type PropertyDeclarations,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import {
  FormAssociatedElement,
  type FormRestoreState,
} from '../../../behaviors/form-associated.ts';
import { PopupController } from '../../../behaviors/popup-controller.ts';
import type { PopupPlacement } from '../../../behaviors/popup-position.ts';
import {
  compareTimes,
  formatTime,
  from12Hour,
  isOnStep,
  localeUses12Hour,
  minutesOnStep,
  parseTime,
  to12Hour,
  type TimeOfDay,
} from '../../../behaviors/time-of-day.ts';
import { resolveLocale } from '../../../behaviors/calendar-date.ts';
import { timePickerStyles } from './time-picker.styles.ts';

/** The look of the field: a border around the container, or a tinted container with a line below. */
export type TimePickerVariant = 'outlined' | 'filled';

/** The clock the popup shows: the locale's own (empty), or forced to 12 or 24 hours. */
export type TimePickerHourCycle = '' | '12' | '24';

type Column = 'hour' | 'minute' | 'period';

interface Option {
  key: string;
  text: string;
  /** The hour as shown (1 to 12 on a 12-hour clock), the minute, or 1 for PM and 0 for AM. */
  value: number;
  selected: boolean;
  disabled: boolean;
}

/**
 * A form-associated time control. The label sits above a button that shows the chosen time; it opens
 * a popup below the field (above when there is no room) with one list of options per part of the time:
 * hours, minutes and, on a 12-hour clock, AM or PM. With `inline` only the lists are rendered.
 *
 * `value` is a 24-hour time (`HH:mm`), empty when nothing is chosen; `min` and `max` limit the choice
 * in the same format, and `step` (minutes, default 5, one that divides an hour) sets which minutes
 * are offered. Choosing an option sets the time at once and fires `input` and `change`; a part that
 * has not been chosen yet is taken as 0 (12 AM). The popup closes after the last list (minutes, or AM
 * and PM) is used. Options that would give a time outside `min` and `max` cannot be chosen.
 *
 * Keyboard: ArrowDown and ArrowUp on the button open the popup; inside, ArrowUp and ArrowDown move in
 * a list, Home and End jump, ArrowLeft and ArrowRight move to the neighbouring list, Enter and Space
 * choose, Escape closes and returns focus to the button. Each list is one tab stop.
 *
 * The format follows `locale` (default: the document language, else the browser's) and `hour-cycle`
 * (`12` or `24` overrides the locale's clock); the list names are attributes (`hours-label`,
 * `minutes-label`, `period-label`) because the component ships no translations. `required` gives
 * `valueMissing`; `min`, `max` and `step` give `rangeUnderflow`, `rangeOverflow` and `stepMismatch`;
 * the error shows after the user leaves the field or a submit fails, or whenever `error-text` is set.
 * A form reset returns to the `value` attribute, and a state restore applies the saved value. For a
 * field without a visible label use `aria-label` on the host. Seconds, a clock face and typing a time
 * are not supported.
 *
 * @tagname su3-time-picker
 * @summary A form-associated time control with lists of hours and minutes.
 *
 * @csspart field - The wrapper around label, container and supporting text.
 * @csspart label - The label.
 * @csspart container - The button that shows the chosen time.
 * @csspart surface - The popup that holds the lists.
 * @csspart columns - The row of lists.
 * @csspart supporting-text - The supporting or error text.
 *
 * @cssprop [--su3-comp-time-picker-container-color] - Background of the filled variant.
 * @cssprop [--su3-comp-time-picker-border-color] - Border color.
 * @cssprop [--su3-comp-time-picker-text-color] - Text color.
 * @cssprop [--su3-comp-time-picker-label-color] - Label color.
 * @cssprop [--su3-comp-time-picker-error-color] - Color of the invalid state.
 * @cssprop [--su3-comp-time-picker-height] - Minimum height of the container.
 * @cssprop [--su3-comp-time-picker-container-shape] - Corner radius of the container.
 * @cssprop [--su3-comp-time-picker-menu-color] - Background of the popup.
 * @cssprop [--su3-comp-time-picker-menu-shape] - Corner radius of the popup.
 * @cssprop [--su3-comp-time-picker-menu-elevation] - Box shadow of the popup.
 * @cssprop [--su3-comp-time-picker-offset] - Gap between the container and the popup.
 * @cssprop [--su3-comp-time-picker-selected-color] - Background of the chosen option.
 * @cssprop [--su3-comp-time-picker-on-selected-color] - Text color of the chosen option.
 * @cssprop [--su3-comp-time-picker-focus-ring-color] - Focus indicator color.
 *
 * @fires input - The user chose a time.
 * @fires change - The user chose a time (after `input`).
 */
export class Su3TimePicker extends FormAssociatedElement {
  static override styles = timePickerStyles;

  static override properties: PropertyDeclarations = {
    variant: { reflect: true },
    label: {},
    supportingText: { attribute: 'supporting-text' },
    errorText: { attribute: 'error-text' },
    placeholder: {},
    required: { type: Boolean, reflect: true },
    min: {},
    max: {},
    step: { type: Number },
    locale: {},
    hourCycle: { attribute: 'hour-cycle' },
    inline: { type: Boolean, reflect: true },
    open: { type: Boolean, reflect: true },
    hoursLabel: { attribute: 'hours-label' },
    minutesLabel: { attribute: 'minutes-label' },
    periodLabel: { attribute: 'period-label' },
    touched: { state: true },
  };

  /** The look of the field. */
  declare variant: TimePickerVariant;

  /** The visible label, shown above the button. */
  declare label: string;

  /** Help shown under the field while there is no error. */
  declare supportingText: string;

  /** An error shown under the field whatever the validity; empty to use the validation message. */
  declare errorText: string;

  /** Shown in the button while no time is chosen. */
  declare placeholder: string;

  /** Makes an empty time invalid. */
  declare required: boolean;

  /** The earliest time that can be chosen, `HH:mm`. */
  declare min: string;

  /** The latest time that can be chosen, `HH:mm`. */
  declare max: string;

  /** The minutes offered: every `step` minutes. It must divide an hour; otherwise 5 is used. */
  declare step: number;

  /** The BCP 47 language tag for formats. Empty uses the document language. */
  declare locale: string;

  /** `12` or `24` forces the clock; empty follows the locale. */
  declare hourCycle: TimePickerHourCycle;

  /** Shows the lists on their own, without the field and the popup. */
  declare inline: boolean;

  /** Whether the popup is shown. Ignored when `inline`. */
  declare open: boolean;

  /** The accessible name of the list of hours. */
  declare hoursLabel: string;

  /** The accessible name of the list of minutes. */
  declare minutesLabel: string;

  /** The accessible name of the list of AM and PM. */
  declare periodLabel: string;

  /** Whether the user has left the field or a submit failed; errors are shown only afterwards. */
  declare touched: boolean;

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
    this.step = 5;
    this.locale = '';
    this.hourCycle = '';
    this.inline = false;
    this.open = false;
    this.hoursLabel = 'Hours';
    this.minutesLabel = 'Minutes';
    this.periodLabel = 'AM or PM';
    this.touched = false;
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

  #chosen(): TimeOfDay | null {
    return parseTime(this.value);
  }

  #language(): string {
    return resolveLocale(this.locale || document.documentElement.lang);
  }

  #uses12Hour(): boolean {
    if (this.hourCycle === '12') return true;
    if (this.hourCycle === '24') return false;
    return localeUses12Hour(this.#language());
  }

  /** Whether a time is inside `min` and `max`. */
  #allowed(time: TimeOfDay): boolean {
    const min = parseTime(this.min);
    const max = parseTime(this.max);
    return (!min || compareTimes(time, min) >= 0) && (!max || compareTimes(time, max) <= 0);
  }

  /** The hour parts are taken from while nothing is chosen: the first one that has a minute to offer. */
  #baseHour(): number {
    for (let hour = 0; hour < 24; hour += 1) {
      if (this.#firstAllowedMinute(hour) !== undefined) return hour;
    }
    return 0;
  }

  /** Whether any time in the AM (`false`) or PM (`true`) half of the day can be chosen. */
  #periodReachable(pm: boolean): boolean {
    for (let hour = pm ? 12 : 0; hour < (pm ? 24 : 12); hour += 1) {
      if (this.#firstAllowedMinute(hour) !== undefined) return true;
    }
    return false;
  }

  /** The first minute of an hour that is on the step and allowed, or `undefined`. */
  #firstAllowedMinute(hour: number): number | undefined {
    return minutesOnStep(this.step).find((minute) => this.#allowed({ hour, minute }));
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('value')) {
      this.internals.setFormValue(this.#chosen() ? this.value : null, this.value);
    }
    this.revalidate();
    if (this.inline) return;
    if (this.#popup.sync(this.open && !this.isDisabled)) {
      void this.updateComplete.then(() => {
        this.#focusColumn(0);
      });
    }
  }

  protected override revalidate(): void {
    const chosen = this.#chosen();
    const min = parseTime(this.min);
    const max = parseTime(this.max);
    const container = this.renderRoot.querySelector<HTMLElement>('.container');
    this.setValidityState(
      {
        valueMissing: this.required && this.value === '',
        badInput: this.value !== '' && !chosen,
        rangeUnderflow: chosen !== null && min !== null && compareTimes(chosen, min) < 0,
        rangeOverflow: chosen !== null && max !== null && compareTimes(chosen, max) > 0,
        stepMismatch: chosen !== null && !isOnStep(chosen, this.step),
      },
      this.value === '' ? 'Please choose a time.' : 'This time is not allowed.',
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

  #close(returnFocus: boolean): void {
    if (!this.open) return;
    this.open = false;
    if (returnFocus) this.renderRoot.querySelector<HTMLElement>('.container')?.focus();
  }

  /** Sets the time; the popup closes when the last list was the one used. */
  #commit(time: TimeOfDay, last: boolean): void {
    if (this.isDisabled || !this.#allowed(time)) return;
    const next = formatTime(time);
    const changed = next !== this.value;
    this.value = next;
    if (changed) {
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (last && !this.inline) this.#close(true);
  }

  #supportingMessage(): { text: string; invalid: boolean } {
    if (this.errorText !== '') return { text: this.errorText, invalid: true };
    if (this.touched && !this.validity.valid) {
      return { text: this.validationMessage, invalid: true };
    }
    return { text: this.supportingText, invalid: false };
  }

  /** The options of each list, as they are shown now. */
  #columns(): { column: Column; label: string; options: Option[] }[] {
    const chosen = this.#chosen();
    const twelve = this.#uses12Hour();
    const hour24 = chosen?.hour ?? this.#baseHour();
    const split = to12Hour(hour24);

    const hours = twelve
      ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      : Array.from({ length: 24 }, (_, index) => index);
    const hourOptions: Option[] = hours.map((value) => {
      const target = twelve ? from12Hour(value, split.pm) : value;
      return {
        key: String(value),
        text: twelve ? String(value) : String(value).padStart(2, '0'),
        value,
        selected: chosen !== null && target === chosen.hour,
        disabled: this.#firstAllowedMinute(target) === undefined,
      };
    });

    const minuteOptions: Option[] = minutesOnStep(this.step).map((value) => ({
      key: String(value),
      text: String(value).padStart(2, '0'),
      value,
      selected: chosen !== null && value === chosen.minute,
      disabled: !this.#allowed({ hour: hour24, minute: value }),
    }));

    const columns: { column: Column; label: string; options: Option[] }[] = [
      { column: 'hour', label: this.hoursLabel, options: hourOptions },
      { column: 'minute', label: this.minutesLabel, options: minuteOptions },
    ];
    if (twelve) {
      const names = this.#periodNames();
      const periods = [
        { pm: false, text: names.am },
        { pm: true, text: names.pm },
      ];
      columns.push({
        column: 'period',
        label: this.periodLabel,
        options: periods.map(({ pm, text }) => ({
          key: pm ? 'pm' : 'am',
          text,
          value: pm ? 1 : 0,
          selected: chosen !== null && pm === split.pm,
          disabled: !this.#periodReachable(pm),
        })),
      });
    }
    return columns;
  }

  /** Applies a choice from a list, reading the time as it is now rather than as it was shown. */
  #choose(column: Column, value: number): void {
    const chosen = this.#chosen();
    const twelve = this.#uses12Hour();
    const hour24 = chosen?.hour ?? this.#baseHour();
    const minute = chosen?.minute ?? 0;
    const split = to12Hour(hour24);
    if (column === 'hour') {
      const target = twelve ? from12Hour(value, split.pm) : value;
      // An hour that cannot keep the current minute takes its first minute that is allowed.
      const wanted = this.#allowed({ hour: target, minute })
        ? minute
        : (this.#firstAllowedMinute(target) ?? 0);
      this.#commit({ hour: target, minute: wanted }, false);
    } else if (column === 'minute') {
      this.#commit({ hour: hour24, minute: value }, !twelve);
    } else {
      // Keep the hour and minute when the other half of the day allows them; otherwise move to the
      // nearest hour of that half that has a minute to offer.
      const pm = value === 1;
      const wanted = from12Hour(split.hour, pm);
      let hour = wanted;
      if (!this.#allowed({ hour: wanted, minute })) {
        const candidates = Array.from({ length: 12 }, (_, index) => (pm ? 12 : 0) + index).filter(
          (candidate) => this.#firstAllowedMinute(candidate) !== undefined,
        );
        // Nearest by the hour as written on the clock face: 12 PM moves to 11 AM, not to 9.
        const face = (value: number): number => to12Hour(value).hour;
        hour =
          candidates.sort(
            (a, b) => Math.abs(face(a) - face(wanted)) - Math.abs(face(b) - face(wanted)),
          )[0] ?? wanted;
      }
      const fits = this.#allowed({ hour, minute });
      this.#commit(
        { hour, minute: fits ? minute : (this.#firstAllowedMinute(hour) ?? minute) },
        true,
      );
    }
  }

  /** The names of AM and PM in the locale. */
  #periodNames(): { am: string; pm: string } {
    const format = new Intl.DateTimeFormat(this.#language(), { hour: 'numeric', hourCycle: 'h12' });
    const period = (hour: number): string =>
      format.formatToParts(new Date(2000, 0, 1, hour)).find((part) => part.type === 'dayPeriod')
        ?.value ?? (hour < 12 ? 'AM' : 'PM');
    return { am: period(0), pm: period(12) };
  }

  /** Moves focus to the tab stop of a list: the chosen option, else the first one that is enabled. */
  #focusColumn(index: number): void {
    const column = this.renderRoot.querySelectorAll<HTMLElement>('.column')[index];
    column?.querySelector<HTMLElement>('.option[tabindex="0"]')?.focus();
  }

  #onColumnKeyDown = (event: KeyboardEvent): void => {
    const list = event.currentTarget;
    if (!(list instanceof HTMLElement)) return;
    const lists = [...this.renderRoot.querySelectorAll<HTMLElement>('.column')];
    const enabled = [...list.querySelectorAll<HTMLElement>('.option')].filter(
      (option) => option.getAttribute('aria-disabled') !== 'true',
    );
    const current = enabled.findIndex((option) => option === event.target);
    const rtl = getComputedStyle(this).direction === 'rtl';
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        enabled[Math.min(current + 1, enabled.length - 1)]?.focus();
        return;
      case 'ArrowUp':
        event.preventDefault();
        enabled[Math.max(current - 1, 0)]?.focus();
        return;
      case 'Home':
        event.preventDefault();
        enabled[0]?.focus();
        return;
      case 'End':
        event.preventDefault();
        enabled[enabled.length - 1]?.focus();
        return;
      case 'ArrowLeft':
      case 'ArrowRight': {
        event.preventDefault();
        const step = (event.key === 'ArrowRight') !== rtl ? 1 : -1;
        const target = lists.indexOf(list) + step;
        if (target >= 0 && target < lists.length) this.#focusColumn(target);
        return;
      }
      case 'Escape':
        if (!this.inline) {
          event.preventDefault();
          this.#close(true);
        }
        return;
      default:
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
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.open = true;
    }
  };

  #renderColumns(): TemplateResult {
    const label = this.label || this.accessibleName;
    return html`<div
      class=${this.isDisabled ? 'columns disabled' : 'columns'}
      part="columns"
      role="group"
      aria-label=${label ?? nothing}
    >
      ${this.#columns().map(({ column, label: name, options }) => {
        // One tab stop per list: the chosen option, else the first one that can be chosen.
        const stop =
          options.find((option) => option.selected && !option.disabled) ??
          options.find((option) => !option.disabled);
        return html`<div
          class="column"
          role="listbox"
          aria-label=${name}
          data-column=${column}
          @keydown=${this.#onColumnKeyDown}
        >
          ${options.map(
            (option) =>
              html`<button
                class="option"
                type="button"
                role="option"
                tabindex=${option === stop ? '0' : '-1'}
                aria-selected=${option.selected ? 'true' : 'false'}
                aria-disabled=${option.disabled || this.isDisabled ? 'true' : nothing}
                @click=${() => {
                  if (!option.disabled) this.#choose(column, option.value);
                }}
              >
                ${option.text}
              </button>`,
          )}
        </div>`;
      })}
    </div>`;
  }

  protected override render(): TemplateResult {
    if (this.inline) return this.#renderColumns();
    const { text, invalid } = this.#supportingMessage();
    const chosen = this.#chosen();
    const shown = chosen
      ? new Intl.DateTimeFormat(this.#language(), {
          hour: 'numeric',
          minute: '2-digit',
          hourCycle: this.#uses12Hour() ? 'h12' : 'h23',
        }).format(new Date(2000, 0, 1, chosen.hour, chosen.minute))
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
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>
      <div
        class="surface"
        part="surface"
        role="dialog"
        popover="manual"
        aria-label=${hasLabel ? this.label : (this.accessibleName ?? 'Choose time')}
      >
        ${this.#renderColumns()}
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
    'su3-time-picker': Su3TimePicker;
  }
}
