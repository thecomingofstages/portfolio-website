import type { FieldSpec } from "@/lib/blocks";
import { normalizeDate } from "@/lib/date-input";

/**
 * The forms for tracks and recruitment rounds (docs/DATABASE.md "tracks", "apply"):
 * every field of the document, in the order an editor fills them in.
 */

export const TRACK_FIELDS: readonly FieldSpec[] = [
  { kind: "text", key: "display_name", label: "Name", required: true, hint: "ชื่อสายงานที่แสดงบนเว็บ" },
  {
    kind: "text",
    key: "key",
    label: "Key",
    required: true,
    hint: "ชื่อที่ใช้ในลิงก์ /tracks/<key> ใช้ได้แค่ตัวพิมพ์เล็ก ตัวเลข และขีด (-) ถ้าเปลี่ยน ลิงก์เก่าที่เคยแชร์ไปจะเข้าไม่ได้",
  },
  { kind: "text", key: "desc", label: "Description", multiline: true, hint: "สายงานนี้ทำอะไร" },
  { kind: "strings", key: "pics", label: "Pictures", images: true, hint: "ลิงก์รูป บรรทัดละรูป" },
  { kind: "int", key: "order", label: "Order", hint: "ลำดับการแสดง เลขน้อยขึ้นก่อน" },
  {
    kind: "items",
    key: "achievements",
    label: "Achievements",
    itemLabel: "Achievement",
    hint: "ผลงานของสายงานนี้ในแต่ละโปรเจกต์",
    fields: [
      { kind: "text", key: "project_slug", label: "Project slug", required: true, hint: "โปรเจกต์ที่ผลงานนี้อยู่" },
      { kind: "int", key: "year", label: "Year", nullable: true },
      { kind: "text", key: "text", label: "What the track did", required: true, multiline: true },
      { kind: "strings", key: "pics", label: "Pictures", images: true, hint: "ลิงก์รูป บรรทัดละรูป" },
      { kind: "bool", key: "is_shown", label: "Shown on the site" },
    ],
    newItem: () => ({ project_slug: "", text: "", is_shown: false }),
  },
  { kind: "bool", key: "is_shown", label: "Shown on the site", hint: "ถ้าปิด สายงานนี้จะไม่แสดงบนเว็บ" },
];

const AUDITION: FieldSpec = {
  kind: "object",
  key: "audition",
  label: "Audition",
  optional: true,
  fields: [
    { kind: "bool", key: "clip_required", label: "Clip required" },
    { kind: "text", key: "clip_brief", label: "Clip brief", multiline: true },
    { kind: "int", key: "clip_max_minutes", label: "Clip length, minutes at most", nullable: true },
    { kind: "text", key: "clip_file_name", label: "Clip file name" },
    { kind: "text", key: "clip_upload", label: "Where to send the clip" },
    { kind: "strings", key: "pieces", label: "Pieces" },
    { kind: "bool", key: "onsite", label: "Onsite audition" },
  ],
};

export const ROUND_FIELDS: readonly FieldSpec[] = [
  { kind: "text", key: "title", label: "Title", required: true },
  { kind: "text", key: "project_slug", label: "Project slug", nullable: true },
  { kind: "date", key: "opens_at", label: "Opens", required: true },
  { kind: "date", key: "closes_at", label: "Closes", required: true },
  { kind: "date", key: "extended_to", label: "Extended to", nullable: true },
  { kind: "text", key: "apply_url", label: "Apply link", nullable: true },
  { kind: "text", key: "poster", label: "Poster", nullable: true, image: true },
  {
    kind: "object",
    key: "qualifications",
    label: "Qualifications",
    optional: true,
    fields: [
      { kind: "int", key: "age_min", label: "Age from", nullable: true },
      { kind: "int", key: "age_max", label: "Age to", nullable: true },
      { kind: "text", key: "age_note", label: "Age note", nullable: true },
      { kind: "strings", key: "items", label: "Qualifications" },
    ],
  },
  {
    kind: "items",
    key: "positions",
    label: "Positions",
    itemLabel: "Position",
    fields: [
      { kind: "text", key: "title", label: "Position", required: true },
      { kind: "text", key: "dept_name", label: "Department name" },
      { kind: "text", key: "unit_name", label: "Unit", nullable: true },
      { kind: "text", key: "description", label: "Description", multiline: true },
      { kind: "strings", key: "requirements", label: "Requirements" },
      { kind: "bool", key: "portfolio_required", label: "Portfolio required" },
      { kind: "bool", key: "onsite_required", label: "Onsite in Bangkok" },
      AUDITION,
      { kind: "bool", key: "is_shown", label: "Shown on the site" },
    ],
    // shortcut: dept_key has no field, so a new position fails to save until the form sets it again.
    newItem: () => ({ dept_key: "", title: "", is_shown: false }),
  },
  {
    kind: "items",
    key: "timeline",
    label: "Timeline",
    itemLabel: "Event",
    fields: [
      { kind: "text", key: "event_name", label: "Event", required: true },
      { kind: "date", key: "start_date", label: "Starts", required: true },
      { kind: "date", key: "end_date", label: "Ends", nullable: true },
      { kind: "text", key: "event_description", label: "Description" },
      { kind: "text", key: "location", label: "Location", nullable: true },
      { kind: "bool", key: "is_shown", label: "Shown on the site" },
    ],
    newItem: () => ({ start_date: "", event_name: "", is_shown: false }),
  },
  { kind: "bool", key: "is_shown", label: "Shown on the site" },
];

export const NEW_TRACK_FIELDS: readonly FieldSpec[] = TRACK_FIELDS.filter((f) => f.key === "display_name" || f.key === "key");
export const NEW_ROUND_FIELDS: readonly FieldSpec[] = ROUND_FIELDS.filter((f) => ["title", "opens_at", "closes_at"].includes(f.key));

/**
 * The forms by name. Pages pass a name, not the fields: the fields hold functions (`newItem`),
 * which a server page cannot hand to a client component.
 */
export const FORMS = {
  track: TRACK_FIELDS,
  round: ROUND_FIELDS,
  "new-track": NEW_TRACK_FIELDS,
  "new-round": NEW_ROUND_FIELDS,
} as const;

/**
 * A document as its form holds it: the fields the server manages (`_id`, `updated_at`) left
 * out, and dates in the form's own shape, so an untouched form is not "changed".
 * Every other field stays, so saving the whole document never drops one.
 */
export function formValue(doc: object, specs: readonly FieldSpec[]): Record<string, unknown> {
  const { _id, updated_at, ...rest } = doc as Record<string, unknown>;
  void _id;
  void updated_at;
  return normalizeDates(rest, specs);
}

function normalizeDates(obj: Record<string, unknown>, specs: readonly FieldSpec[]): Record<string, unknown> {
  const out = { ...obj };
  for (const spec of specs) {
    const value = out[spec.key];
    if (spec.kind === "date" && typeof value === "string" && value !== "") out[spec.key] = normalizeDate(value);
    if (spec.kind === "object" && value && typeof value === "object") {
      out[spec.key] = normalizeDates(value as Record<string, unknown>, spec.fields);
    }
    if (spec.kind === "items" && Array.isArray(value)) {
      out[spec.key] = value.map((item) => normalizeDates(item as Record<string, unknown>, spec.fields));
    }
  }
  return out;
}
