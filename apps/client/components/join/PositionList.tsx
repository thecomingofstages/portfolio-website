import type { Audition, Position } from "@/types/api";

export type PositionListProps = {
  positions: Position[] | null | undefined;
};

function nonEmpty(value: string | null | undefined): string | null {
  return value && value.trim() !== "" ? value : null;
}

function hasAuditionContent(audition: Audition | null | undefined): audition is Audition {
  if (!audition) {
    return false;
  }
  const hasBrief = nonEmpty(audition.clip_brief) !== null;
  const hasMaxMinutes = typeof audition.clip_max_minutes === "number";
  const hasFileName = nonEmpty(audition.clip_file_name) !== null;
  const hasUpload = nonEmpty(audition.clip_upload) !== null;
  const hasPieces = Array.isArray(audition.pieces) && audition.pieces.length > 0;
  const hasOnsite = audition.onsite === true;

  return hasBrief || hasMaxMinutes || hasFileName || hasUpload || hasPieces || hasOnsite;
}

/**
 * Open positions of a recruitment RoundCard (docs/DATABASE.md "`positions[]`" and
 * "`positions[].audition`", task 2.2).
 *
 * For each position in API order, shows:
 * - `dept_name`, `unit_name`, `title`, `description` and `requirements`;
 * - `portfolio_required` and `onsite_required` flags as gold badges when true;
 * - `audition` details when present (clip brief, max minutes, file name, upload method,
 *   `pieces` in API order, and onsite audition round).
 *
 * Renders nothing when `positions` is empty or null.
 */
export default function PositionList({ positions }: PositionListProps) {
  if (!positions || positions.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      {/* TODO(positions wording): the docs do not specify the exact labels for position flags or audition fields; using "<...>" until confirmed. */}
      <h3 className="font-heading text-h3 font-semibold text-foreground">ตำแหน่งที่เปิดรับ</h3>
      <ul className="flex flex-col gap-4">
        {positions.map((position, index) => {
          const deptName = nonEmpty(position.dept_name);
          const unitName = nonEmpty(position.unit_name);
          const description = nonEmpty(position.description);
          const requirements = Array.isArray(position.requirements) ? position.requirements : [];
          const portfolioRequired = position.portfolio_required === true;
          const onsiteRequired = position.onsite_required === true;
          const showAudition = hasAuditionContent(position.audition);

          const audition = position.audition;
          const clipBrief = nonEmpty(audition?.clip_brief);
          const clipMaxMinutes =
            typeof audition?.clip_max_minutes === "number" ? audition.clip_max_minutes : null;
          const clipFileName = nonEmpty(audition?.clip_file_name);
          const clipUpload = nonEmpty(audition?.clip_upload);
          const pieces = Array.isArray(audition?.pieces) ? audition.pieces : [];
          const auditionOnsite = audition?.onsite === true;

          return (
            <li
              key={`${position.dept_key}-${position.title}-${index}`}
              className="flex flex-col gap-4 rounded-card border border-border bg-card-bg p-6"
            >
              <div className="flex flex-col gap-1">
                {deptName || unitName ? (
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-body text-muted">
                    {deptName ? <span>{deptName}</span> : null}
                    {deptName && unitName ? <span aria-hidden="true">·</span> : null}
                    {unitName ? <span>{unitName}</span> : null}
                  </p>
                ) : null}

                <h3 className="font-heading text-h3 font-semibold text-foreground">
                  {position.title}
                </h3>
              </div>

              {/* Flags: portfolio_required and onsite_required */}
              {portfolioRequired || onsiteRequired ? (
                <ul className="flex flex-wrap gap-2.5 font-body text-body">
                  {/* portfolio_required */}
                  {portfolioRequired ? (
                    <li
                      data-field="portfolio_required"
                      className="rounded-button border border-accent bg-accent px-3.5 py-0.5 font-bold text-background"
                    >
                      {"<...>"}
                    </li>
                  ) : null}
                  {/* onsite_required (must be able to work onsite in Bangkok) */}
                  {onsiteRequired ? (
                    <li
                      data-field="onsite_required"
                      className="rounded-button border border-accent bg-accent px-3.5 py-0.5 font-bold text-background"
                    >
                      {"<...>"}
                    </li>
                  ) : null}
                </ul>
              ) : null}

              {/* description */}
              {description ? (
                <p className="font-body text-body text-foreground">{description}</p>
              ) : null}

              {/* requirements[] */}
              {requirements.length > 0 ? (
                <ul className="list-disc space-y-1.5 pl-5 font-body text-body text-foreground marker:text-accent">
                  {requirements.map((req, reqIndex) => (
                    <li key={`${reqIndex}-${req}`}>{req}</li>
                  ))}
                </ul>
              ) : null}

              {/* audition section (rendered only when audition has displayable content) */}
              {showAudition ? (
                <div className="flex flex-col gap-3 rounded-card bg-background/40 p-5">
                  {/* Audition section heading */}
                  <h4 className="font-heading text-body-lg font-semibold text-accent">{"<...>"}</h4>

                  <dl className="grid grid-cols-1 gap-4 font-body text-body sm:grid-cols-3">
                    {/* audition.clip_brief */}
                    {clipBrief ? (
                      <div className="flex flex-col gap-0.5 sm:col-span-3">
                        <dt className="text-muted">{"<...>"}</dt>
                        <dd className="text-foreground">{clipBrief}</dd>
                      </div>
                    ) : null}

                    {/* audition.clip_max_minutes */}
                    {clipMaxMinutes !== null ? (
                      <div className="flex flex-col gap-0.5">
                        <dt className="text-muted">{"<...>"}</dt>
                        <dd className="text-foreground">{clipMaxMinutes}</dd>
                      </div>
                    ) : null}

                    {/* audition.clip_file_name */}
                    {clipFileName ? (
                      <div className="flex flex-col gap-0.5">
                        <dt className="text-muted">{"<...>"}</dt>
                        <dd className="text-foreground">{clipFileName}</dd>
                      </div>
                    ) : null}

                    {/* audition.clip_upload */}
                    {clipUpload ? (
                      <div className="flex flex-col gap-0.5">
                        <dt className="text-muted">{"<...>"}</dt>
                        <dd className="text-foreground">{clipUpload}</dd>
                      </div>
                    ) : null}

                    {/* audition.pieces[] */}
                    {pieces.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <dt className="text-muted">{"<...>"}</dt>
                        <dd className="text-foreground">
                          <ul className="list-disc space-y-1 pl-5 marker:text-accent">
                            {pieces.map((piece, pieceIndex) => (
                              <li key={`${pieceIndex}-${piece}`}>{piece}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    ) : null}

                    {/* audition.onsite (onsite audition after the clip round) */}
                    {auditionOnsite ? (
                      <div className="flex flex-col gap-0.5">
                        <dt className="text-muted">{"<...>"}</dt>
                        <dd data-field="audition_onsite" className="text-foreground">
                          {"<...>"}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
