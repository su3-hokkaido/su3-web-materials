/** A calendar date in the proleptic Gregorian calendar, without a time or a time zone. */
export interface CalendarDate {
  /** The full year, for example 2026. */
  year: number;
  /** The month, 1 to 12. */
  month: number;
  /** The day of the month, 1 to 31. */
  day: number;
}

/** Days of a week, 0 for Sunday to 6 for Saturday (the numbering of `Date.prototype.getDay`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/u;

/** The number of days in a month; `month` is 1 to 12. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Parses `YYYY-MM-DD`; anything else, and dates that do not exist (2026-02-30), give `null`. Years
 * before 1000 are rejected too: `Date` reads the years 0 to 99 as 1900 to 1999, and a date picker
 * has no use for them.
 */
export function parseIsoDate(value: string): CalendarDate | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month))
    return null;
  return { year, month, day };
}

/** Formats as `YYYY-MM-DD`. */
export function formatIsoDate(date: CalendarDate): string {
  const pad = (value: number, length: number): string => String(value).padStart(length, '0');
  return `${pad(date.year, 4)}-${pad(date.month, 2)}-${pad(date.day, 2)}`;
}

/** The local calendar date today. */
export function today(): CalendarDate {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** Negative when `a` is before `b`, zero when they are the same day, positive when after. */
export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export function isSameDate(a: CalendarDate | null, b: CalendarDate | null): boolean {
  return a !== null && b !== null && compareDates(a, b) === 0;
}

/** The weekday of a date. */
export function weekdayOf(date: CalendarDate): Weekday {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay() as Weekday;
}

/** Moves by a number of days, across months and years. */
export function addDays(date: CalendarDate, days: number): CalendarDate {
  const moved = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: moved.getUTCFullYear(),
    month: moved.getUTCMonth() + 1,
    day: moved.getUTCDate(),
  };
}

/** Moves by a number of months, keeping the day or the last day of a shorter month. */
export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

/** The date limited to `min` and `max`, each of which may be absent. */
export function clampDate(
  date: CalendarDate,
  min: CalendarDate | null,
  max: CalendarDate | null,
): CalendarDate {
  if (min && compareDates(date, min) < 0) return min;
  if (max && compareDates(date, max) > 0) return max;
  return date;
}

/**
 * The weeks of a month as rows of seven dates, starting on `firstDay`. The first and last rows
 * contain days of the neighbouring months, so every row is complete.
 */
export function monthGrid(year: number, month: number, firstDay: Weekday): CalendarDate[][] {
  const first: CalendarDate = { year, month, day: 1 };
  const lead = (weekdayOf(first) - firstDay + 7) % 7;
  const total = Math.ceil((lead + daysInMonth(year, month)) / 7) * 7;
  const weeks: CalendarDate[][] = [];
  for (let index = 0; index < total; index += 1) {
    const row = Math.floor(index / 7);
    (weeks[row] ??= []).push(addDays(first, index - lead));
  }
  return weeks;
}

/**
 * A language tag the platform can format with: the preferred one when it is valid, else the
 * browser's language, else `en`. A bad tag such as `en_US` would make `Intl` throw while rendering.
 */
export function resolveLocale(preferred: string): string {
  for (const tag of [preferred, navigator.language, 'en']) {
    if (tag === '') continue;
    try {
      if (Intl.DateTimeFormat.supportedLocalesOf(tag).length > 0) return tag;
    } catch {
      // A malformed tag throws; try the next one.
    }
  }
  return 'en';
}

interface WeekInfoLocale {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
}

/**
 * The first day of the week in a locale (Sunday in `en-US`, Monday in `de`), or Monday when the
 * platform cannot tell.
 */
export function firstDayOfWeekFor(locale: string): Weekday {
  try {
    const info = new Intl.Locale(locale) as unknown as WeekInfoLocale;
    const firstDay = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay;
    // Intl numbers the week from Monday (1) to Sunday (7).
    if (typeof firstDay === 'number') return (firstDay % 7) as Weekday;
  } catch {
    // An invalid locale tag falls through to the default.
  }
  return 1;
}
