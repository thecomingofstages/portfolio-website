/**
 * The one place dates are formatted. API dates arrive as ISO 8601 strings.
 *
 * TODO(date format): Thai calendar ("28 มิ.ย. 2568") or English ("28 Jun 2025")
 * is not decided. Until then dates show as YYYY-MM-DD, so nothing has to change
 * outside this file when the format is chosen.
 */

const TIME_ZONE = "Asia/Bangkok";

const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type DateInput = string | Date;

function toDate(value: DateInput): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Formats one date, or a range when `end` is given and falls on another day.
 * Returns "" for a missing or invalid date (for example a `<...>` placeholder).
 */
export function formatDate(start: DateInput | null | undefined, end?: DateInput | null): string {
  const startDate = start == null ? null : toDate(start);
  if (!startDate) return "";
  const from = dateFormat.format(startDate);
  const endDate = end == null ? null : toDate(end);
  if (!endDate) return from;
  const to = dateFormat.format(endDate);
  return to === from ? from : `${from} – ${to}`;
}

