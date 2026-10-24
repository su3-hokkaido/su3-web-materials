import { describe, expect, it } from 'vitest';
import {
  compareTimes,
  formatTime,
  from12Hour,
  isOnStep,
  localeUses12Hour,
  minutesOf,
  minutesOnStep,
  normalizeStep,
  parseTime,
  to12Hour,
} from './time-of-day.ts';

describe('parseTime and formatTime', () => {
  it('round-trips a valid time and pads the parts', () => {
    expect(parseTime('09:05')).toEqual({ hour: 9, minute: 5 });
    expect(formatTime({ hour: 9, minute: 5 })).toBe('09:05');
    expect(parseTime('23:59')).toEqual({ hour: 23, minute: 59 });
    expect(parseTime('00:00')).toEqual({ hour: 0, minute: 0 });
  });

  it('rejects other formats and times that do not exist', () => {
    for (const bad of [
      '',
      '9:05',
      '09:5',
      '24:00',
      '12:60',
      '12-30',
      '12:30:00',
      'noon',
      ' 12:30',
    ]) {
      expect(parseTime(bad)).toBeNull();
    }
  });
});

describe('comparing', () => {
  it('counts minutes since midnight and orders times', () => {
    expect(minutesOf({ hour: 1, minute: 30 })).toBe(90);
    expect(compareTimes({ hour: 9, minute: 0 }, { hour: 9, minute: 30 })).toBeLessThan(0);
    expect(compareTimes({ hour: 10, minute: 0 }, { hour: 9, minute: 59 })).toBeGreaterThan(0);
    expect(compareTimes({ hour: 9, minute: 5 }, { hour: 9, minute: 5 })).toBe(0);
  });
});

describe('the 12-hour clock', () => {
  it('maps midnight to 12 AM and noon to 12 PM', () => {
    expect(to12Hour(0)).toEqual({ hour: 12, pm: false });
    expect(to12Hour(1)).toEqual({ hour: 1, pm: false });
    expect(to12Hour(11)).toEqual({ hour: 11, pm: false });
    expect(to12Hour(12)).toEqual({ hour: 12, pm: true });
    expect(to12Hour(13)).toEqual({ hour: 1, pm: true });
    expect(to12Hour(23)).toEqual({ hour: 11, pm: true });
  });

  it('maps back, so every hour survives a round trip', () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const split = to12Hour(hour);
      expect(from12Hour(split.hour, split.pm)).toBe(hour);
    }
  });

  it('knows which locales use it', () => {
    expect(localeUses12Hour('en-US')).toBe(true);
    expect(localeUses12Hour('de-DE')).toBe(false);
    expect(localeUses12Hour('not a locale')).toBe(false);
  });
});

describe('minute steps', () => {
  it('accepts steps that divide an hour and falls back to 5 otherwise', () => {
    expect(normalizeStep(1)).toBe(1);
    expect(normalizeStep(15)).toBe(15);
    expect(normalizeStep(30)).toBe(30);
    for (const bad of [0, -5, 7, 45, 61, 2.5, Number.NaN]) expect(normalizeStep(bad)).toBe(5);
  });

  it('lists the minutes of an hour on the step', () => {
    expect(minutesOnStep(15)).toEqual([0, 15, 30, 45]);
    expect(minutesOnStep(30)).toEqual([0, 30]);
    expect(minutesOnStep(1)).toHaveLength(60);
    expect(minutesOnStep(5)).toHaveLength(12);
  });

  it('tells whether a time is on the step', () => {
    expect(isOnStep({ hour: 9, minute: 30 }, 15)).toBe(true);
    expect(isOnStep({ hour: 9, minute: 31 }, 15)).toBe(false);
    expect(isOnStep({ hour: 9, minute: 31 }, 1)).toBe(true);
  });
});
