/**
 * The one place dates are formatted. API dates arrive as ISO 8601 strings.
 *
 * Thai calendar, full month name, Bangkok time (docs/TASKS.md F6):
 * "28 เมษายน 2568", "28 เมษายน 2568 – 1 พฤษภาคม 2568", "28 เมษายน 2568 14:30 – 18:00".
 */

const TIME_ZONE = "Asia/Bangkok";

const dateFormat = new Intl.DateTimeFormat("th-TH", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("th-TH", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const DAY_MS = 24 * 60 * 60 * 1000;

type DateInput = string | Date;

function toDate(value: DateInput): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// A date saved without a time is midnight UTC (docs/DATABASE.md "Conventions"), so it shows no time.
function timeOf(date: Date): string | null {
  return date.getTime() % DAY_MS === 0 ? null : timeFormat.format(date);
}

function withTime(day: string, time: string | null): string {
  return time ? `${day} ${time}` : day;
}

/**
 * Formats one date, or a range when `end` is given, each with its time when it has one.
 * A range within one day shows the day once, with the end time when both ends have one.
 * Returns "" for a missing or invalid date (for example a `<...>` placeholder).
 */
export function formatDate(start: DateInput | null | undefined, end?: DateInput | null): string {
  const startDate = start == null ? null : toDate(start);
  if (!startDate) return "";
  const startDay = dateFormat.format(startDate);
  const startTime = timeOf(startDate);
  const from = withTime(startDay, startTime);
  const endDate = end == null ? null : toDate(end);
  if (!endDate) return from;
  const endDay = dateFormat.format(endDate);
  const endTime = timeOf(endDate);
  if (endDay === startDay) {
    return startTime && endTime && endTime !== startTime ? `${from} – ${endTime}` : from;
  }
  return `${from} – ${withTime(endDay, endTime)}`;
}
