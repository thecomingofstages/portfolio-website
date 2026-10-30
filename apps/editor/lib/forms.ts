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
  { kind: "strings", key: "pics", label: "Pictures", images: true },
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
      { kind: "strings", key: "pics", label: "Pictures", images: true },
      { kind: "bool", key: "is_shown", label: "Shown on the site" },
    ],
    newItem: () => ({ project_slug: "", text: "", is_shown: false }),
  },
  { kind: "bool", key: "is_shown", label: "Shown on the site", hint: "ถ้าปิด สายงานนี้จะไม่แสดงบนเว็บ" },
];

const AUDITION: FieldSpec = {
  kind: "object",
  key: "audition",
  label: "ออดิชัน",
  optional: true,
  fields: [
    { kind: "bool", key: "clip_required", label: "ต้องส่งคลิป" },
    { kind: "text", key: "clip_brief", label: "โจทย์คลิป", multiline: true },
    { kind: "int", key: "clip_max_minutes", label: "ความยาวคลิปไม่เกิน (นาที)", nullable: true },
    { kind: "text", key: "clip_file_name", label: "รูปแบบชื่อไฟล์คลิป" },
    { kind: "bool", key: "onsite", label: "ออดิชันที่สถานที่จริง" },
  ],
};

export const ROUND_FIELDS: readonly FieldSpec[] = [
  { kind: "text", key: "title", label: "ชื่อรอบรับสมัคร", required: true },
  { kind: "text", key: "project_slug", label: "โปรเจกต์", nullable: true },
  { kind: "date", key: "opens_at", label: "วันเปิดรับสมัคร", required: true },
  { kind: "date", key: "closes_at", label: "วันปิดรับสมัคร", required: true },
  { kind: "date", key: "extended_to", label: "ขยายเวลาถึง", nullable: true },
  { kind: "text", key: "apply_url", label: "ลิงก์ฟอร์มสมัคร", nullable: true },
  { kind: "text", key: "poster", label: "โปสเตอร์", nullable: true, image: true },
  {
    kind: "object",
    key: "qualifications",
    label: "คุณสมบัติ",
    optional: true,
    fields: [
      { kind: "int", key: "age_min", label: "อายุตั้งแต่", nullable: true },
      { kind: "int", key: "age_max", label: "อายุถึง", nullable: true },
      { kind: "text", key: "age_note", label: "หมายเหตุเรื่องอายุ", nullable: true },
      { kind: "strings", key: "items", label: "คุณสมบัติแต่ละข้อ" },
    ],
  },
  {
    kind: "items",
    key: "positions",
    label: "ตำแหน่งที่รับ",
    itemLabel: "ตำแหน่ง",
    fields: [
      { kind: "text", key: "title", label: "ชื่อตำแหน่ง", required: true },
      { kind: "text", key: "dept_name", label: "ฝ่าย" },
      { kind: "text", key: "unit_name", label: "แผนก", nullable: true },
      { kind: "text", key: "description", label: "รายละเอียด", multiline: true },
      { kind: "strings", key: "requirements", label: "คุณสมบัติเฉพาะตำแหน่ง" },
      { kind: "bool", key: "portfolio_required", label: "ต้องมีพอร์ตโฟลิโอ" },
      { kind: "bool", key: "onsite_required", label: "ต้องมาทำงานที่กรุงเทพฯ ได้" },
      AUDITION,
      { kind: "bool", key: "is_shown", label: "แสดงบนเว็บ" },
    ],
    // dept_key has no field and is not tied to a track: new positions start with it empty.
    newItem: () => ({ dept_key: "", title: "", is_shown: false }),
  },
  {
    kind: "items",
    key: "timeline",
    label: "กำหนดการ",
    itemLabel: "ขั้นตอน",
    fields: [
      { kind: "text", key: "event_name", label: "ชื่อขั้นตอน", required: true },
      { kind: "date", key: "start_date", label: "วันเริ่ม", required: true },
      { kind: "date", key: "end_date", label: "วันสิ้นสุด", nullable: true },
      { kind: "text", key: "event_description", label: "รายละเอียด" },
      { kind: "text", key: "location", label: "สถานที่", nullable: true },
      { kind: "bool", key: "is_shown", label: "แสดงบนเว็บ" },
    ],
    newItem: () => ({ start_date: "", event_name: "", is_shown: false }),
  },
  { kind: "bool", key: "is_shown", label: "แสดงบนเว็บ" },
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
