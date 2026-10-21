import type { Qualifications as QualificationsType } from "@/types/api";

export type QualificationsProps = {
  qualifications: QualificationsType | null | undefined;
};

/**
 * Qualifications section of a recruitment RoundCard (docs/DATABASE.md "`qualifications`", task 2.1).
 *
 * Shows who can apply to a round:
 * - `age_min`–`age_max` (or only the bound that is set) with Thai labels;
 * - `age_note` when set, on its own line below the age line;
 * - `items` as an unordered list with gold markers in the exact order sent by the API.
 *
 * Renders nothing when all fields are empty or null.
 */
export default function Qualifications({ qualifications }: QualificationsProps) {
  if (!qualifications) {
    return null;
  }

  const { age_min, age_max, age_note, items } = qualifications;
  const hasMin = typeof age_min === "number";
  const hasMax = typeof age_max === "number";
  const hasAge = hasMin || hasMax;
  const noteText = age_note && age_note.trim() !== "" ? age_note : null;
  const listItems = Array.isArray(items) ? items : [];

  if (!hasAge && !noteText && listItems.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-card-bg p-6">
      <div className="flex flex-col gap-1.5">
        <h3 className="font-heading text-body font-medium text-muted">คุณสมบัติผู้สมัคร</h3>

        {hasAge ? (
          <p className="flex items-baseline gap-2 leading-none">
            {hasMin && hasMax ? (
              <>
                <span className="font-heading text-h1 font-extrabold text-accent">
                  {age_min}–{age_max}
                </span>{" "}
                <span className="font-heading text-h3 font-semibold text-foreground">ปี</span>
              </>
            ) : hasMin ? (
              <>
                <span className="font-heading text-h3 font-semibold text-foreground">อายุขั้นต่ำ</span>{" "}
                <span className="font-heading text-h1 font-extrabold text-accent">{age_min}</span>{" "}
                <span className="font-heading text-h3 font-semibold text-foreground">ปี</span>
              </>
            ) : (
              <>
                <span className="font-heading text-h3 font-semibold text-foreground">อายุไม่เกิน</span>{" "}
                <span className="font-heading text-h1 font-extrabold text-accent">{age_max}</span>{" "}
                <span className="font-heading text-h3 font-semibold text-foreground">ปี</span>
              </>
            )}
          </p>
        ) : null}

        {noteText ? <p className="font-body text-body text-muted">{noteText}</p> : null}
      </div>

      {listItems.length > 0 ? (
        <>
          {(hasAge || noteText) ? <hr className="border-t border-border" /> : null}
          <ul className="list-disc space-y-2.5 pl-5 font-body text-body font-semibold text-foreground marker:text-accent">
            {listItems.map((item, index) => (
              <li key={`${index}-${item}`} className="pl-1">
                {item}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
