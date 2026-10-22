import type { Qualifications as QualificationsType } from "@/types/api";

export type QualificationsProps = {
  qualifications: QualificationsType | null | undefined;
};

// TODO(qualifications age wording): the docs do not specify the exact wording for single age bounds;
// these follow the old JD wording ("อายุอยู่ในช่วง x–y ปี") and the project lead's examples.
function formatAgeRange(
  ageMin: number | null | undefined,
  ageMax: number | null | undefined,
): string | null {
  const hasMin = typeof ageMin === "number";
  const hasMax = typeof ageMax === "number";

  if (hasMin && hasMax) {
    return `อายุอยู่ในช่วง ${ageMin}–${ageMax} ปี`;
  }
  if (hasMin) {
    return `อายุ ${ageMin} ปีขึ้นไป`;
  }
  if (hasMax) {
    return `อายุไม่เกิน ${ageMax} ปี`;
  }
  return null;
}

/**
 * Qualifications section of a recruitment RoundCard (docs/DATABASE.md "`qualifications`", task 2.1).
 *
 * Shows who can apply to a round as a bulleted list:
 * - `age_min`–`age_max` (or only the bound that is set) and `age_note` when set;
 * - `items` as list items in the exact order sent by the API.
 *
 * Renders nothing when all fields are empty or null.
 */
export default function Qualifications({ qualifications }: QualificationsProps) {
  if (!qualifications) {
    return null;
  }

  const { age_min, age_max, age_note, items } = qualifications;
  const ageText = formatAgeRange(age_min, age_max);
  const noteText = age_note && age_note.trim() !== "" ? age_note : null;
  const listItems = Array.isArray(items) ? items : [];

  if (!ageText && !noteText && listItems.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-card-bg p-6">
      {/* TODO(qualifications wording): the docs give no Thai heading; "Qualifications" follows tcos_ui_flow.drawio. */}
      <h3 className="font-heading text-h3 font-semibold text-foreground">Qualifications</h3>
      <ul className="list-disc space-y-2 pl-6 font-body text-body text-foreground marker:text-accent">
        {ageText || noteText ? (
          <li>
            {ageText ? <span>{ageText}</span> : null}
            {ageText && noteText ? " " : null}
            {noteText ? <span className="text-muted">{noteText}</span> : null}
          </li>
        ) : null}
        {listItems.map((item, index) => (
          <li key={`${index}-${item}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
