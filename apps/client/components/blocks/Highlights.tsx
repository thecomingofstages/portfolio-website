import Media from "@/components/Media";
import { formatDate } from "@/lib/dates";
import type { BlockProps } from ".";

/**
 * The `highlights` block (task 1.9, docs/DATABASE.md "highlights"): events within
 * a project, as the server filled them in. One card per highlight, in the order
 * sent: `pics`, `event_name`, `date`, `venue` and `desc`.
 */
export default function Highlights({ block }: BlockProps<"highlights">) {
  const { title, highlights } = block;

  // TODO(empty highlights block wording): nothing is shown when no highlight is sent.
  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-8">
      {title ? <h2 className="font-heading text-h2 font-bold text-foreground">{title}</h2> : null}

      <ul className="grid gap-6 md:grid-cols-2">
        {highlights.map((highlight, index) => {
          const { event_name, date, venue, desc, pics } = highlight;
          const dateText = formatDate(date);
          const [cover, ...more] = pics;

          return (
            <li key={`${event_name}-${date}-${index}`}>
              <article className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-card-bg">
                {cover !== undefined ? (
                  <div className="relative aspect-[3/2] w-full overflow-hidden">
                    <Media
                      src={cover}
                      alt={event_name}
                      fill
                      sizes="(min-width: 768px) 40vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                {more.length > 0 ? (
                  <ul className="grid grid-cols-3 gap-1 p-1">
                    {more.map((pic, picIndex) => (
                      <li key={`${pic}-${picIndex}`} className="relative aspect-[3/2] overflow-hidden">
                        {/* The cover already carries the event name; repeating it here is noise. */}
                        <Media src={pic} alt="" fill sizes="(min-width: 768px) 13vw, 30vw" className="object-cover" />
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="flex flex-col gap-2 p-4 md:p-6">
                  <h3 className="font-heading text-h3 font-semibold text-foreground break-words">{event_name}</h3>
                  {dateText || venue ? (
                    <p className="font-body text-body text-muted">
                      {dateText ? <time dateTime={date ?? undefined}>{dateText}</time> : null}
                      {dateText && venue ? " · " : null}
                      {venue}
                    </p>
                  ) : null}
                  {desc ? <p className="font-body text-body text-foreground break-words">{desc}</p> : null}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
