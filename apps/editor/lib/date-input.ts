/**
 * Stored dates ↔ the editor's date and time inputs, in Bangkok time.
 *
 * A date saved without a time is midnight UTC (docs/DATABASE.md "Conventions"), and the
 * site shows it without a time (lib/dates.ts). Any other instant has a time, shown and
 * edited in Bangkok (UTC+7, no daylight saving), and sent back with its zone, as the
 * server asks ("2025-06-28T19:00:00+07:00").
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const BANGKOK_MS = 7 * 60 * 60 * 1000;

export type DateParts = { date: string; time: string };

/** `{ date: "YYYY-MM-DD", time: "HH:MM" or "" }` in Bangkok, or null for a missing or invalid date (e.g. "<...>"). */
export function toDateParts(value: string | null | undefined): DateParts | null {
  if (!value) return null;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return null;
  if (ms % DAY_MS === 0) return { date: new Date(ms).toISOString().slice(0, 10), time: "" };
  const bangkok = new Date(ms + BANGKOK_MS).toISOString();
  return { date: bangkok.slice(0, 10), time: bangkok.slice(11, 16) };
}

/** What the editor sends: "YYYY-MM-DD", or with a time, "YYYY-MM-DDTHH:MM:00+07:00". */
export function fromDateParts({ date, time }: DateParts): string {
  return time ? `${date}T${time}:00+07:00` : date;
}

/** A stored date in the editor's sent form, so an untouched form is not "changed". Invalid values stay as they are. */
export function normalizeDate(value: string): string {
  const parts = toDateParts(value);
  return parts ? fromDateParts(parts) : value;
}
