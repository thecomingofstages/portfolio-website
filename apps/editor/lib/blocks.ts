import type { Block, BlockType } from "@/types/admin";

/**
 * What the editor knows about each block type: its label, its kind, the form
 * fields it shows, and a new, empty block of that type. Fields follow
 * tcos_schema.mongodb.js; descriptions follow docs/DATABASE.md "Blocks".
 */

/**
 * One form field.
 * - `text`: a string. Empty means "not set": the key is removed, or set to null
 *   when `nullable`. Required strings stay "" when empty.
 * - `enum`: one of `options`. "Not set" removes the key, or sets null when
 *   `nullable`; a `required` enum has no "Not set".
 * - `int`: a whole number, or null when empty (`nullable`).
 * - `bool`: true or false.
 * - `strings`: a list of strings, one per line.
 * - `image` / `images`: the value is an image URL (or a list of them), so the field also offers an upload.
 * - `value`: a stat's value: a number when it reads as one, otherwise text.
 * - `items`: a list of objects, each with its own fields.
 * - `date`: a date with an optional Bangkok time (lib/date-input.ts). Empty as for `text`.
 * - `object`: one object with its own fields; `optional` ones can be added and removed.
 */
export type FieldSpec =
  | { kind: "text"; key: string; label: string; required?: boolean; nullable?: boolean; multiline?: boolean; image?: boolean; hint?: string }
  | { kind: "enum"; key: string; label: string; options: readonly string[]; required?: boolean; nullable?: boolean; hint?: string }
  | { kind: "int"; key: string; label: string; nullable?: boolean; hint?: string }
  | { kind: "bool"; key: string; label: string; hint?: string }
  | { kind: "strings"; key: string; label: string; images?: boolean; hint?: string }
  | { kind: "value"; key: string; label: string; required?: boolean; hint?: string }
  | { kind: "date"; key: string; label: string; required?: boolean; nullable?: boolean; hint?: string }
  | {
      kind: "object";
      key: string;
      label: string;
      fields: readonly FieldSpec[];
      /** May be left out: the form offers "Add" and "Remove". */
      optional?: boolean;
      hint?: string;
    }
  | {
      kind: "items";
      key: string;
      label: string;
      itemLabel: string;
      fields: readonly FieldSpec[];
      newItem: () => Record<string, unknown>;
      hint?: string;
    };

export type BlockInfo = {
  label: string;
  kind: "content" | "data";
  description: string;
  fields: readonly FieldSpec[];
  /** The type's own fields for a new block: required ones empty, data pointers at their "all" value. */
  defaults: () => Record<string, unknown>;
};

const buttonFields: readonly FieldSpec[] = [
  { kind: "text", key: "label", label: "Label", required: true },
  { kind: "text", key: "url", label: "URL", required: true, hint: "ใส่ได้ทั้งพาท เช่น /join ลิงก์เต็ม หรือ mailto:" },
  { kind: "enum", key: "style", label: "Style", options: ["primary", "secondary"] },
];

const buttons = (required: boolean): FieldSpec => ({
  kind: "items",
  key: "buttons",
  label: required ? "Buttons" : "Buttons (optional)",
  itemLabel: "Button",
  fields: buttonFields,
  newItem: () => ({ label: "", url: "" }),
});

const projectSlug: FieldSpec = {
  kind: "text",
  key: "project_slug",
  label: "Project slug",
  nullable: true,
  hint: "เว้นว่างไว้: ในหน้าโปรเจกต์จะใช้โปรเจกต์นั้น ในหน้าแรกจะใช้ทุกโปรเจกต์ที่แสดงอยู่",
};

const limit: FieldSpec = { kind: "int", key: "limit", label: "Limit", nullable: true, hint: "เว้นว่างไว้: แสดงทั้งหมด" };

export const blockInfo: Record<BlockType, BlockInfo> = {
  hero: {
    label: "Hero",
    kind: "content",
    description: "ส่วนบนสุดของหน้า เป็นรูป วิดีโอ หรือสไลด์โชว์ มีชื่อและปุ่มวางอยู่ด้านบน",
    fields: [
      { kind: "text", key: "subtitle", label: "Subtitle" },
      { kind: "text", key: "media_url", label: "Media URL", required: true, image: true, hint: "รูปหรือวิดีโอ ถ้าเป็นสไลด์โชว์ให้ใส่สไลด์แรก" },
      { kind: "enum", key: "media_kind", label: "Media kind", options: ["image", "video", "slideshow"] },
      { kind: "strings", key: "slides", label: "Slides", images: true, hint: "ใช้กับสไลด์โชว์เท่านั้น ใส่ลิงก์รูปที่ต่อจากสไลด์แรก บรรทัดละรูป" },
      { kind: "int", key: "slide_seconds", label: "Seconds per slide", nullable: true, hint: "เว้นว่างไว้: ใช้ค่าตั้งต้นของเว็บ" },
      buttons(false),
    ],
    defaults: () => ({ media_url: "" }),
  },
  article: {
    label: "Article",
    kind: "content",
    description: "ส่วนเนื้อหาที่เขียนด้วย Markdown จะใส่รูปประกอบด้วยก็ได้",
    fields: [
      { kind: "text", key: "body", label: "Body (Markdown)", required: true, multiline: true },
      { kind: "text", key: "image", label: "Image", nullable: true, image: true },
      { kind: "enum", key: "image_side", label: "Image side", options: ["left", "right", "top"], nullable: true },
    ],
    defaults: () => ({ body: "", image: null, image_side: null }),
  },
  image: {
    label: "Image",
    kind: "content",
    description: "รูปเดี่ยว ถ้าเลือกขนาด large รูปจะกว้างเต็มหน้า เหมาะกับรูปรวมทีม",
    fields: [
      { kind: "text", key: "url", label: "Image", required: true, image: true },
      { kind: "text", key: "alt", label: "Alt text", hint: "บอกว่าในรูปมีอะไร สำหรับคนที่ใช้โปรแกรมอ่านหน้าจอ" },
      { kind: "text", key: "caption", label: "Caption" },
      { kind: "text", key: "credit", label: "Credit" },
      { kind: "enum", key: "size", label: "Size", options: ["normal", "large"] },
    ],
    defaults: () => ({ url: "" }),
  },
  quote: {
    label: "Quote",
    kind: "content",
    description: "คำพูดที่วางบนรูปหรือสีพื้นหลัง",
    fields: [
      { kind: "text", key: "text", label: "Quote", required: true, multiline: true },
      { kind: "text", key: "who", label: "Who", required: true },
      { kind: "text", key: "role", label: "Role" },
      { kind: "text", key: "background_image", label: "Background image", nullable: true, image: true },
      { kind: "text", key: "background_color", label: "Background colour", nullable: true },
    ],
    defaults: () => ({ text: "", who: "", background_image: null, background_color: null }),
  },
  gallery: {
    label: "Gallery",
    kind: "content",
    description: "รวมหลายรูป แต่ละรูปมีคำอธิบาย",
    fields: [
      {
        kind: "items",
        key: "items",
        label: "Images",
        itemLabel: "Image",
        fields: [
          { kind: "text", key: "url", label: "Image", required: true, image: true },
          { kind: "text", key: "alt", label: "Alt text" },
          { kind: "text", key: "desc", label: "Description", multiline: true },
        ],
        newItem: () => ({ url: "" }),
      },
    ],
    defaults: () => ({ items: [] }),
  },
  video: {
    label: "Video",
    kind: "content",
    description: "วิดีโอเดียว หรือหลายตอนต่อกัน เช่น สารคดีที่แบ่งเป็นตอน",
    fields: [
      {
        kind: "items",
        key: "videos",
        label: "Videos",
        itemLabel: "Video",
        fields: [
          { kind: "text", key: "url", label: "Video URL", required: true },
          { kind: "enum", key: "provider", label: "Provider", options: ["youtube", "tiktok", "instagram", "drive"], required: true },
          { kind: "text", key: "title", label: "Title" },
          { kind: "text", key: "caption", label: "Caption" },
        ],
        newItem: () => ({ url: "", provider: "youtube" }),
      },
    ],
    defaults: () => ({ videos: [] }),
  },
  button: {
    label: "Buttons",
    kind: "content",
    description: "ลิงก์ที่ทำเป็นปุ่ม เช่น ซื้อบัตร บริจาค LINE สมัคร ติดต่อ",
    fields: [buttons(true), { kind: "enum", key: "align", label: "Align", options: ["left", "center"] }],
    defaults: () => ({ buttons: [] }),
  },
  stats: {
    label: "Stats",
    kind: "content",
    description: "ตัวเลขที่ยืนยันแล้ว เช่น จำนวนสมาชิก จำนวนรอบการแสดง",
    fields: [
      {
        kind: "items",
        key: "items",
        label: "Numbers",
        itemLabel: "Number",
        fields: [
          { kind: "text", key: "label", label: "Label", required: true },
          { kind: "value", key: "value", label: "Value", required: true, hint: "ตัวเลข หรือข้อความก็ได้" },
          { kind: "text", key: "note", label: "Note" },
        ],
        newItem: () => ({ label: "", value: "" }),
      },
    ],
    defaults: () => ({ items: [] }),
  },
  highlights: {
    label: "Highlights",
    kind: "data",
    description: "กิจกรรมจากรายการไฮไลต์ของโปรเจกต์",
    fields: [projectSlug, limit],
    defaults: () => ({ project_slug: null, limit: null }),
  },
  team: {
    label: "Team",
    kind: "data",
    description: "รายชื่อคนจากทีมของโปรเจกต์ จัดกลุ่มตามฝ่าย",
    fields: [
      projectSlug,
      { kind: "strings", key: "dept_keys", label: "Department keys", hint: "ใส่รหัสสายงานบรรทัดละหนึ่งรหัส เว้นว่างไว้: ทุกฝ่าย" },
      { kind: "bool", key: "show_org_chart", label: "Show the org chart" },
      { kind: "enum", key: "layout", label: "Layout", options: ["list", "yearbook"] },
    ],
    defaults: () => ({ project_slug: null, dept_keys: [], show_org_chart: false, layout: "list" }),
  },
  sponsors: {
    label: "Sponsors",
    kind: "data",
    description: "ผู้สนับสนุนจากรายชื่อสปอนเซอร์ โลโก้จะขึ้นเฉพาะเจ้าที่อนุญาตไว้",
    fields: [projectSlug, { kind: "strings", key: "tiers", label: "Tiers", hint: "ใส่ระดับสปอนเซอร์บรรทัดละหนึ่งระดับ เว้นว่างไว้: ทุกระดับ" }],
    defaults: () => ({ project_slug: null, tiers: [] }),
  },
  join: {
    label: "Join",
    kind: "data",
    description: "รอบรับสมัครที่เปิดอยู่วันนี้",
    fields: [projectSlug, { kind: "text", key: "empty_text", label: "Text when no round is open", multiline: true }],
    defaults: () => ({ project_slug: null }),
  },
  projects: {
    label: "Projects shelf",
    kind: "data",
    description: "ชั้นหนังสือของโปรเจกต์ที่แสดงอยู่ เรียงจากใหม่ไปเก่า",
    fields: [limit],
    defaults: () => ({ limit: null }),
  },
  tracks: {
    label: "Tracks",
    kind: "data",
    description: "การ์ดของสายงานที่แสดงอยู่ เรียงตามลำดับ บล็อกนี้ไม่มีอะไรให้ตั้งค่า",
    fields: [],
    defaults: () => ({}),
  },
  yearbook: {
    label: "Yearbook cards",
    kind: "data",
    description: "โปรเจกต์ที่แสดงอยู่และมีหนังสือรุ่น เรียงจากใหม่ไปเก่า",
    fields: [limit],
    defaults: () => ({ limit: null }),
  },
};

/**
 * The block types the public site renders today (apps/client/components/blocks/index.ts).
 * The others save as usual but show nothing until their component lands.
 * blocks.test.ts fails when this list and the client's drift apart.
 */
export const ON_SITE: ReadonlySet<BlockType> = new Set<BlockType>([
  "article",
  "button",
  "gallery",
  "hero",
  "image",
  "join",
  "projects",
  "quote",
  "sponsors",
  "tracks",
  "video",
]);

/** The home page has no hide switches: the page and its blocks are always shown. */
export const isAlwaysShown = (pageKey: string) => pageKey === "home";

/** On the home page, a Hero as the first block is the banner (the client's app/page.tsx): it stays first. */
export const hasHomeBanner = (pageKey: string, blocks: readonly { type: string }[]) =>
  isAlwaysShown(pageKey) && blocks[0]?.type === "hero";

/** A UUID v7 (RFC 9562): a 48-bit millisecond timestamp, then random bits. */
export function uuidv7(now = Date.now()): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  for (let i = 0; i < 6; i++) b[i] = Math.floor(now / 2 ** (8 * (5 - i))) & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * A new block of `type` with a UUID v7 id. It starts hidden until it is filled in, so a
 * half-made block never shows on the site, unless the page has no hide switch (`shown`).
 */
export function newBlock(type: BlockType, shown = false): Block {
  return {
    id: uuidv7(),
    type,
    title: null,
    is_shown: shown,
    ...blockInfo[type].defaults(),
  } as Block;
}

/** A copy of `list` with the item at `from` moved to `to`. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return [...list];
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/** Sets `key` on `obj`, or removes it when `value` is undefined. */
export function setField<T extends object>(obj: T, key: string, value: unknown): T {
  const copy = { ...obj } as Record<string, unknown>;
  if (value === undefined) delete copy[key];
  else copy[key] = value;
  return copy as T;
}

/** A stat value from its input: a number when the text is one, otherwise the text. */
export function parseStatValue(text: string): number | string {
  const trimmed = text.trim();
  return /^-?\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : text;
}

// --- editing on the page (the client's edit mode, docs/EDITOR.md "Editing on the page") ---

/**
 * The fields the page lets you edit in place, per block type, as the client marks them
 * (`data-field` in apps/client/components/blocks). `*` is any item of a list.
 */
export const PAGE_FIELDS: Partial<Record<BlockType, { text: readonly string[]; images: readonly string[] }>> = {
  hero: { text: ["title", "subtitle", "buttons.*.label"], images: ["media_url", "slides.*"] },
  article: { text: ["title", "body"], images: ["image"] },
  image: { text: ["title", "caption", "credit"], images: ["url"] },
  quote: { text: ["title", "text", "who", "role"], images: ["background_image"] },
  gallery: { text: ["title", "items.*.desc"], images: ["items.*.url"] },
  button: { text: ["title", "buttons.*.label"], images: [] },
  video: { text: ["title", "videos.*.title", "videos.*.caption"], images: [] },
};

const pattern = (path: string) => path.replace(/\.\d+(?=\.|$)/g, ".*");

/** True when `path` is a field of this block type the page may change: text or image. */
export function isPageField(type: BlockType, path: string, kind: "text" | "images"): boolean {
  return /^[a-z_]+(\.\d+(\.[a-z_]+)?)?$/.test(path) && (PAGE_FIELDS[type]?.[kind].includes(pattern(path)) ?? false);
}

export function getPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((at, key) => (at && typeof at === "object" ? (at as Record<string, unknown>)[key] : undefined), obj);
}

/** A copy with `path` set, copying the lists and objects on the way; undefined removes the field. */
export function setPath<T>(obj: T, path: string, value: unknown): T {
  const [key, ...rest] = path.split(".");
  const copy = (Array.isArray(obj) ? [...obj] : { ...(obj as object) }) as Record<string, unknown>;
  const next = rest.length ? setPath(copy[key] ?? {}, rest.join("."), value) : value;
  if (next === undefined && !Array.isArray(copy)) delete copy[key];
  else copy[key] = next;
  return copy as T;
}

/** The FieldSpec a path points at: "title", or an item's field such as "items.2.desc". */
function specFor(type: BlockType, path: string): FieldSpec | undefined {
  if (path === "title") return { kind: "text", key: "title", label: "Section heading", nullable: true };
  const [key, , itemKey] = path.split(".");
  const spec = blockInfo[type].fields.find((f) => f.key === key);
  return itemKey && spec?.kind === "items" ? spec.fields.find((f) => f.key === itemKey) : spec;
}

/** Text typed on the page as the field stores it: empty is null, left out, or "" when required (as in FieldInput). */
export function pageValue(type: BlockType, path: string, text: string): unknown {
  if (text !== "") return text;
  const spec = specFor(type, path);
  if (spec && "required" in spec && spec.required) return "";
  if (spec && "nullable" in spec && spec.nullable) return null;
  return /\.\d+$/.test(path) ? "" : undefined;
}
