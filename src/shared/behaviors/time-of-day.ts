/** A time of day on a 24-hour clock, without a date or a time zone. */
export interface TimeOfDay {
  /** The hour, 0 to 23. */
  hour: number;
  /** The minute, 0 to 59. */
  minute: number;
}

const TIME = /^(\d{2}):(\d{2})$/u;

/** Parses `HH:mm` (24-hour); anything else, and times that do not exist (24:00, 12:60), give `null`. */
export function parseTime(value: string): TimeOfDay | null {
  const match = TIME.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

/** Formats as `HH:mm`. */
export function formatTime(time: TimeOfDay): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${pad(time.hour)}:${pad(time.minute)}`;
}

/** The minutes since midnight. */
export function minutesOf(time: TimeOfDay): number {
  return time.hour * 60 + time.minute;
}

/** Negative when `a` is earlier than `b`, zero when they are the same, positive when later. */
export function compareTimes(a: TimeOfDay, b: TimeOfDay): number {
  return minutesOf(a) - minutesOf(b);
}

/** Splits a 24-hour hour into the 12-hour clock: 0 is 12 AM, 12 is 12 PM. */
export function to12Hour(hour: number): { hour: number; pm: boolean } {
  return { hour: hour % 12 === 0 ? 12 : hour % 12, pm: hour >= 12 };
}

/** The 24-hour hour for a 12-hour clock hour (1 to 12) and the AM or PM half. */
export function from12Hour(hour: number, pm: boolean): number {
  return (hour % 12) + (pm ? 12 : 0);
}

/**
 * A usable minute step: a whole number of minutes from 1 to 30 that divides an hour, so every hour
 * has the same minutes. Anything else gives the default of 5.
 */
export function normalizeStep(step: number): number {
  return Number.isInteger(step) && step >= 1 && step <= 30 && 60 % step === 0 ? step : 5;
}

/** Whether a time is on the step (its minute is a multiple of `step`). */
export function isOnStep(time: TimeOfDay, step: number): boolean {
  return time.minute % normalizeStep(step) === 0;
}

/** The minutes of an hour that are on the step, in order. */
export function minutesOnStep(step: number): number[] {
  const size = normalizeStep(step);
  return Array.from({ length: 60 / size }, (_, index) => index * size);
}

/** Whether a locale writes the time on a 12-hour clock by default. */
export function localeUses12Hour(locale: string): boolean {
  try {
    const { hourCycle } = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions();
    return hourCycle === 'h11' || hourCycle === 'h12';
  } catch {
    return false;
  }
}
