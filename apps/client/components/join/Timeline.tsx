import { formatDate } from "@/lib/dates";
import type { TimelineEvent } from "@/types/api";

// TODO(timeline wording): the docs do not specify the exact Thai/English labels;
// kept in one constants object.
export const LABELS = {
  heading: "กำหนดการรับสมัคร",
  online: "ออนไลน์",
} as const;

export type TimelineProps = {
  timeline: TimelineEvent[] | null | undefined;
};

function nonEmpty(value: string | null | undefined): string | null {
  return value && value.trim() !== "" ? value : null;
}

/**
 * Schedule of a recruitment RoundCard (docs/DATABASE.md "`timeline[]`", task 2.3).
 *
 * For each event in API order, shows:
 * - `start_date`–`end_date` formatted exclusively via `formatDate` from `lib/dates.ts`
 *   (TODO(date format): time-of-day formatting is pending in `lib/dates.ts`);
 * - `event_name` and optional `event_description`;
 * - `location`, or `LABELS.online` when `location` is `null`.
 *
 * Renders nothing when `timeline` is empty or null.
 */
export default function Timeline({ timeline }: TimelineProps) {
  if (!timeline || timeline.length === 0) {
    return null;
  }

  return (
    <section className="flex w-full flex-col gap-6 rounded-card border border-border bg-card-bg p-6 sm:py-8">
      {/* Section heading */}
      <h3 className="font-heading text-h3 font-semibold text-foreground">{LABELS.heading}</h3>

      <ol className="flex flex-col">
        {timeline.map((event, index) => {
          const isLast = index === timeline.length - 1;
          // TODO(date format): formatDate in lib/dates.ts currently outputs YYYY-MM-DD only;
          // when time-of-day formatting is added to lib/dates.ts, it will surface here automatically.
          const formattedDate = formatDate(event.start_date, event.end_date);
          const rawDateText = formattedDate || nonEmpty(event.start_date);
          const hasValidIsoDate = formattedDate !== "";
          const eventName = nonEmpty(event.event_name);
          const description = nonEmpty(event.event_description);
          const isOnline = event.location === null;
          const rawLocation = event.location ?? LABELS.online;
          const locationText = nonEmpty(rawLocation);

          return (
            <li
              key={`${event.start_date}-${event.event_name}-${index}`}
              className="grid grid-cols-1 gap-2 sm:grid-cols-[11rem_auto_1fr] sm:gap-4"
            >
              {/* Left column: Dates (right-aligned on sm+ screens, stacked above on phones) */}
              <div className="pt-0.5 sm:text-right">
                {rawDateText ? (
                  hasValidIsoDate ? (
                    <time
                      dateTime={event.start_date}
                      className="block font-body text-body font-bold text-balance text-accent break-words"
                    >
                      {rawDateText}
                    </time>
                  ) : (
                    <span className="block font-body text-body font-bold text-balance text-accent break-words">
                      {rawDateText}
                    </span>
                  )
                ) : null}
              </div>

              {/* Middle column: Vertical timeline circular marker and connecting line */}
              <div className="hidden sm:flex sm:flex-col sm:items-center" aria-hidden="true">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="mt-1.5 h-4 w-4 shrink-0 text-accent"
                >
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" />
                </svg>
                {!isLast ? <span className="my-1 w-px grow bg-border" /> : null}
              </div>

              {/* Right column: Event details */}
              <div
                className={`flex min-w-0 flex-col gap-1.5 border-l border-border pl-4 sm:border-l-0 sm:pl-0 ${
                  isLast ? "" : "pb-10"
                }`}
              >
                {/* event_name */}
                {eventName ? (
                  <p className="font-heading text-h3 font-semibold text-foreground break-words">
                    {eventName}
                  </p>
                ) : null}

                {/* event_description */}
                {description ? (
                  <p className="font-body text-body text-muted break-words">{description}</p>
                ) : null}

                {/* location (or LABELS.online when location is null) */}
                {locationText ? (
                  <p
                    data-field="location"
                    className={`flex items-center gap-2 pt-0.5 font-body text-body break-words ${
                      isOnline ? "text-muted" : "text-foreground"
                    }`}
                  >
                    {!isOnline ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 shrink-0 text-accent"
                      >
                        <path d="M12 21s-6-5.25-6-10a6 6 0 1 1 12 0c0 4.75-6 10-6 10Z" />
                        <circle cx="12" cy="11" r="2.25" />
                      </svg>
                    ) : null}
                    <span>{locationText}</span>
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
