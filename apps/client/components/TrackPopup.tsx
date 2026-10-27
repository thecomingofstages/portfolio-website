import Media from "@/components/Media";
import type { Achievement, TrackDetail } from "@/types/api";

/**
 * What the track popup shows (task 3.3, docs/FRONTEND.md "Sprint 3: Track,
 * Yearbook"): `display_name`, `pics`, `desc` and the achievements, each with
 * `year`, `text`, `pics` and the project name as plain text, never a link.
 * No team list and no open positions for now (docs/DATABASE.md "Pages and
 * their queries"). Task 3.4 puts it in the popup over /tracks and on the full
 * page at /tracks/<key>.
 */
export default function TrackPopup({ track }: { track: TrackDetail }) {
  const { display_name, desc, pics, achievements } = track;

  return (
    <article className="flex flex-col gap-6">
      <h1 className="font-heading text-h1 font-bold text-foreground break-words">{display_name}</h1>

      {pics.length > 0 ? <Pictures pics={pics} sizes="(min-width: 768px) 40vw, 90vw" /> : null}

      {desc ? <p className="font-body text-body text-foreground whitespace-pre-line break-words">{desc}</p> : null}

      {achievements.length > 0 ? (
        <section className="flex flex-col gap-4">
          {/* TODO(achievements heading wording): the docs give no heading text. */}
          <h2 className="font-heading text-h2 font-bold text-foreground">{"<...>"}</h2>
          <ul className="flex flex-col gap-4">
            {achievements.map((achievement, index) => (
              <li key={`${achievement.project_name}-${achievement.year ?? "none"}-${index}`}>
                <AchievementItem achievement={achievement} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function AchievementItem({ achievement }: { achievement: Achievement }) {
  const { year, text, pics, project_name } = achievement;

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-card-bg p-4 md:p-5">
      <p className="flex flex-wrap gap-x-3 font-heading text-h3 font-semibold text-foreground">
        {year !== null ? <span className="text-accent">{year}</span> : null}
        {/* The project's name is plain text, never a link (docs/DATABASE.md "tracks"). */}
        <span className="break-words">{project_name}</span>
      </p>
      <p className="font-body text-body text-muted whitespace-pre-line break-words">{text}</p>
      {pics.length > 0 ? <Pictures pics={pics} sizes="(min-width: 768px) 35vw, 80vw" /> : null}
    </div>
  );
}

/** The pictures show whole, in their own proportions (project lead, 13 Oct 2026). */
function Pictures({ pics, sizes }: { pics: string[]; sizes: string }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2 md:items-start">
      {pics.map((pic, index) => (
        <li key={`${pic}-${index}`}>
          {/* The API sends no alt text for these pictures. */}
          <Media
            src={pic}
            alt=""
            width={1200}
            height={800}
            sizes={sizes}
            style={{ width: "100%", height: "auto" }}
            className="aspect-[auto_3/2]"
          />
        </li>
      ))}
    </ul>
  );
}
