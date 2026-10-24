import { describe, expect, it } from 'vitest';
import {
  resolveLocale,
  addDays,
  addMonths,
  clampDate,
  compareDates,
  daysInMonth,
  firstDayOfWeekFor,
  formatIsoDate,
  isSameDate,
  monthGrid,
  parseIsoDate,
  today,
  weekdayOf,
} from './calendar-date.ts';

const date = (year: number, month: number, day: number) => ({ year, month, day });

describe('parseIsoDate and formatIsoDate', () => {
  it('round-trips a valid date and pads the parts', () => {
    expect(parseIsoDate('2026-03-05')).toEqual(date(2026, 3, 5));
    expect(formatIsoDate(date(2026, 3, 5))).toBe('2026-03-05');
    expect(formatIsoDate(date(42, 1, 2))).toBe('0042-01-02');
  });

  it('rejects other formats and dates that do not exist', () => {
    for (const bad of [
      '',
      '2026-3-5',
      '2026/03/05',
      '2026-02-30',
      '2026-13-01',
      '2026-00-10',
      'x',
    ]) {
      expect(parseIsoDate(bad)).toBeNull();
    }
    expect(parseIsoDate('2024-02-29')).toEqual(date(2024, 2, 29));
    expect(parseIsoDate('2026-02-29')).toBeNull();
  });

  it('rejects years before 1000, which Date would read as 19xx', () => {
    expect(parseIsoDate('0050-01-01')).toBeNull();
    expect(parseIsoDate('0999-12-31')).toBeNull();
    expect(parseIsoDate('1000-01-01')).toEqual(date(1000, 1, 1));
  });
});

describe('calendar arithmetic', () => {
  it('knows the length of months, also in leap years', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 12)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
  });

  it('adds days across month and year boundaries, forwards and backwards', () => {
    expect(addDays(date(2026, 1, 31), 1)).toEqual(date(2026, 2, 1));
    expect(addDays(date(2026, 12, 31), 1)).toEqual(date(2027, 1, 1));
    expect(addDays(date(2026, 3, 1), -1)).toEqual(date(2026, 2, 28));
    expect(addDays(date(2026, 1, 1), -1)).toEqual(date(2025, 12, 31));
    expect(addDays(date(2026, 3, 10), 14)).toEqual(date(2026, 3, 24));
  });

  it('adds a negative number of months across years', () => {
    expect(addMonths(date(2026, 1, 15), -13)).toEqual(date(2024, 12, 15));
    expect(addMonths(date(2026, 3, 31), -1)).toEqual(date(2026, 2, 28));
  });

  it('adds months and keeps the day or the last day of a shorter month', () => {
    expect(addMonths(date(2026, 1, 31), 1)).toEqual(date(2026, 2, 28));
    expect(addMonths(date(2024, 1, 31), 1)).toEqual(date(2024, 2, 29));
    expect(addMonths(date(2026, 12, 15), 1)).toEqual(date(2027, 1, 15));
    expect(addMonths(date(2026, 1, 15), -1)).toEqual(date(2025, 12, 15));
    expect(addMonths(date(2026, 5, 15), 12)).toEqual(date(2027, 5, 15));
    expect(addMonths(date(2026, 5, 15), -17)).toEqual(date(2024, 12, 15));
  });

  it('compares, equates and clamps dates', () => {
    expect(compareDates(date(2026, 3, 5), date(2026, 3, 6))).toBeLessThan(0);
    expect(compareDates(date(2027, 1, 1), date(2026, 12, 31))).toBeGreaterThan(0);
    expect(compareDates(date(2026, 3, 5), date(2026, 3, 5))).toBe(0);
    expect(isSameDate(date(2026, 3, 5), date(2026, 3, 5))).toBe(true);
    expect(isSameDate(date(2026, 3, 5), null)).toBe(false);
    const min = date(2026, 3, 10);
    const max = date(2026, 3, 20);
    expect(clampDate(date(2026, 3, 1), min, max)).toEqual(min);
    expect(clampDate(date(2026, 3, 30), min, max)).toEqual(max);
    expect(clampDate(date(2026, 3, 15), min, max)).toEqual(date(2026, 3, 15));
    expect(clampDate(date(2026, 3, 1), null, null)).toEqual(date(2026, 3, 1));
  });

  it('gives the weekday of a date, Sunday being 0', () => {
    expect(weekdayOf(date(2026, 10, 23))).toBe(5);
    expect(weekdayOf(date(2024, 2, 29))).toBe(4);
    expect(weekdayOf(date(2023, 1, 1))).toBe(0);
  });

  it('gives today as a local calendar date', () => {
    const now = new Date();
    expect(today()).toEqual(date(now.getFullYear(), now.getMonth() + 1, now.getDate()));
  });
});

describe('monthGrid', () => {
  it('lays out whole weeks that start on the chosen day', () => {
    // October 2026 starts on a Thursday.
    const monday = monthGrid(2026, 10, 1);
    expect(monday.every((week) => week.length === 7)).toBe(true);
    expect(monday[0]?.[0]).toEqual(date(2026, 9, 28));
    expect(monday[0]?.[3]).toEqual(date(2026, 10, 1));
    expect(monday.at(-1)?.at(-1)).toEqual(date(2026, 11, 1));
    const sunday = monthGrid(2026, 10, 0);
    expect(sunday[0]?.[0]).toEqual(date(2026, 9, 27));
    expect(sunday[0]?.[4]).toEqual(date(2026, 10, 1));
  });

  it('uses four rows for a February that fits and six when a month needs them', () => {
    // February 2026 starts on a Sunday and has 28 days.
    expect(monthGrid(2026, 2, 0)).toHaveLength(4);
    // August 2026 starts on a Saturday and has 31 days: six Sunday-first rows.
    expect(monthGrid(2026, 8, 0)).toHaveLength(6);
  });

  it('contains every day of the month exactly once', () => {
    const days = monthGrid(2026, 10, 1)
      .flat()
      .filter((item) => item.month === 10)
      .map((item) => item.day);
    expect(days).toEqual(Array.from({ length: 31 }, (_, index) => index + 1));
  });
});

describe('resolveLocale', () => {
  it('keeps a valid tag and replaces a malformed or empty one', () => {
    expect(resolveLocale('de-DE')).toBe('de-DE');
    expect(resolveLocale('en_US')).not.toBe('en_US');
    expect(() => new Intl.DateTimeFormat(resolveLocale('not a locale'))).not.toThrow();
    expect(() => new Intl.DateTimeFormat(resolveLocale(''))).not.toThrow();
  });
});

describe('firstDayOfWeekFor', () => {
  it('starts the week on Sunday in the US and on Monday in Germany', () => {
    expect(firstDayOfWeekFor('en-US')).toBe(0);
    expect(firstDayOfWeekFor('de-DE')).toBe(1);
  });

  it('falls back to Monday for an invalid locale', () => {
    expect(firstDayOfWeekFor('not a locale')).toBe(1);
  });
});
