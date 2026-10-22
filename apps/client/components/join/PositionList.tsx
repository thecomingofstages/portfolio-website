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
  const hasClipRequired = audition.clip_required === true;

  return (
    hasBrief ||
    hasMaxMinutes ||
    hasFileName ||
    hasUpload ||
    hasPieces ||
    hasOnsite ||
    hasClipRequired
  );
}

/**
 * Open positions of a recruitment RoundCard (docs/DATABASE.md "`positions[]`" and
 * "`positions[].audition`", task 2.2).
 *
 * For each position in API order, shows:
 * - `dept_name`, `unit_name`, `title`, `description` and `requirements`;
 * - `portfolio_required` and `onsite_required` flags as gold pill badges when true;
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
      {/* TODO(positions wording): the docs give no Thai labels for flag/audition headings; English labels follow tcos_ui_flow.drawio. */}
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

              {portfolioRequired || onsiteRequired ? (
                <ul className="flex flex-wrap gap-2.5 font-body text-body">
                  {portfolioRequired ? (
                    <li className="rounded-full border border-accent bg-accent px-3.5 py-0.5 font-bold text-background">
                      Portfolio required
                    </li>
                  ) : null}
                  {onsiteRequired ? (
                    <li className="rounded-full border border-accent bg-accent px-3.5 py-0.5 font-bold text-background">
                      Onsite in Bangkok required
                    </li>
                  ) : null}
                </ul>
              ) : null}

              {description ? (
                <p className="font-body text-body text-foreground">{description}</p>
              ) : null}

              {requirements.length > 0 ? (
                <div className="flex flex-col gap-1.5 font-body text-body">
                  <p className="text-muted">Requirements</p>
                  <ul className="list-disc space-y-1.5 pl-5 text-foreground marker:text-accent">
                    {requirements.map((req, reqIndex) => (
                      <li key={`${reqIndex}-${req}`}>{req}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {showAudition ? (
                <div className="flex flex-col gap-3 rounded-card bg-background/40 p-5">
                  <h4 className="font-heading text-body-lg font-semibold text-accent">Audition</h4>

                  <dl className="flex flex-col gap-2.5 font-body text-body">
                    {clipBrief ? (
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-4 sm:gap-4">
                        <dt className="text-muted">Clip brief</dt>
                        <dd className="text-foreground sm:col-span-3">{clipBrief}</dd>
                      </div>
                    ) : null}

                    {clipMaxMinutes !== null ? (
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-4 sm:gap-4">
                        <dt className="text-muted">Maximum length</dt>
                        <dd className="text-foreground sm:col-span-3">{clipMaxMinutes} min</dd>
                      </div>
                    ) : null}

                    {clipFileName ? (
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-4 sm:gap-4">
                        <dt className="text-muted">File name</dt>
                        <dd className="text-foreground sm:col-span-3">{clipFileName}</dd>
                      </div>
                    ) : null}

                    {clipUpload ? (
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-4 sm:gap-4">
                        <dt className="text-muted">Upload</dt>
                        <dd className="text-foreground sm:col-span-3">{clipUpload}</dd>
                      </div>
                    ) : null}

                    {pieces.length > 0 ? (
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-4 sm:gap-4">
                        <dt className="text-muted">Pieces</dt>
                        <dd className="text-foreground sm:col-span-3">
                          <ul className="list-disc space-y-1 pl-5 marker:text-accent">
                            {pieces.map((piece, pieceIndex) => (
                              <li key={`${pieceIndex}-${piece}`}>{piece}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    ) : null}

                    {auditionOnsite ? (
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-4 sm:gap-4">
                        <dt className="text-muted">Onsite round</dt>
                        <dd className="text-foreground sm:col-span-3">
                          Onsite audition after the clip round
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
