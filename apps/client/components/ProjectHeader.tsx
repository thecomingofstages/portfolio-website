import Media from "@/components/Media";
import { formatDate } from "@/lib/dates";
import type { ProjectPage } from "@/types/api";

export type ProjectHeaderProps = {
  project: Pick<ProjectPage, "name" | "start_date" | "end_date" | "venue" | "pics">;
};

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  const { name, start_date, end_date, venue, pics } = project;
  const dateText = formatDate(start_date, end_date);
  const coverUrl = pics && pics.length > 0 ? pics[0] : null;

  return (
    <header className="flex flex-col gap-5 pb-6 border-b border-border">
      {/* COVER: image goes here (on mobile: order-1 on top; on desktop md+: order-2 below title) */}
      <div className="order-1 md:order-2 relative aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-card-bg">
        {coverUrl ? (
          <Media
            src={coverUrl}
            alt={name}
            fill
            priority
            sizes="(min-width: 768px) 80vw, 90vw"
            className="object-cover"
          />
        ) : null}
      </div>

      {/* Project Title & Meta (on mobile: order-2 below cover; on desktop md+: order-1 above cover) */}
      <div className="order-2 md:order-1 flex flex-col gap-2.5">
        <h1 className="font-heading text-h1 font-extrabold text-foreground">{name}</h1>

        {(dateText || venue) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-body text-body">
            {dateText && (
              <div className="flex items-center gap-2 text-accent font-medium">
                <svg
                  className="h-4 w-4 shrink-0 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <time dateTime={start_date}>{dateText}</time>
              </div>
            )}

            {venue && (
              <div className="flex items-center gap-2 text-muted">
                <svg
                  className="h-4 w-4 shrink-0 text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{venue}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
