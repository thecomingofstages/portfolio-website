import Media from "@/components/Media";
import { formatDate } from "@/lib/dates";
import type { Round } from "@/types/api";
import PositionList from "./PositionList";
import Qualifications from "./Qualifications";
import Timeline from "./Timeline";

export const APPLY_LABEL = "Apply";

export type RoundCardProps = {
  round: Round;
};

export default function RoundCard({ round }: RoundCardProps) {
  const { title, poster, opens_at, closes_at, extended_to, project_name, apply_url } = round;
  const dates = formatDate(opens_at, extended_to ?? closes_at);

  return (
    <article className="grid grid-cols-1 overflow-hidden rounded-card border border-border bg-card-bg md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      {poster !== null ? (
        <div className="relative aspect-square w-full self-center overflow-hidden">
          <Media
            src={poster}
            alt={title}
            fill
            sizes="(min-width: 768px) 27vw, 90vw"
            className="object-contain"
          />
        </div>
      ) : null}

      <div className={`flex min-w-0 flex-col gap-6 p-4 md:p-6 ${poster === null ? "md:col-span-2" : ""}`}>
        <header className="flex flex-col gap-1">
          {project_name ? <p className="font-body text-body text-muted break-words">{project_name}</p> : null}
          <h2 className="font-heading text-h2 font-bold text-foreground break-words">{title}</h2>
          {dates ? (
            <p className="font-body text-body-lg font-semibold text-accent">
              <time dateTime={opens_at}>{dates}</time>
            </p>
          ) : null}
        </header>

        <Qualifications qualifications={round.qualifications} />
        <PositionList positions={round.positions} />
        <Timeline timeline={round.timeline} />

        {isApplyUrl(apply_url) ? (
          <a
            href={apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-button bg-accent px-6 py-2.5 font-body text-body-lg font-semibold text-background transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent"
          >
            {APPLY_LABEL}
          </a>
        ) : null}
      </div>
    </article>
  );
}

function isApplyUrl(url: string | null): url is string {
  return url !== null && /^https?:\/\//.test(url);
}
