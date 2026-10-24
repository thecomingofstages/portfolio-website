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
 * - `value`: a stat's value: a number when it reads as one, otherwise text.
 * - `items`: a list of objects, each with its own fields.
 */
export type FieldSpec =
  | { kind: "text"; key: string; label: string; required?: boolean; nullable?: boolean; multiline?: boolean; hint?: string }
  | { kind: "enum"; key: string; label: string; options: readonly string[]; required?: boolean; nullable?: boolean; hint?: string }
  | { kind: "int"; key: string; label: string; nullable?: boolean; hint?: string }
  | { kind: "bool"; key: string; label: string; hint?: string }
  | { kind: "strings"; key: string; label: string; hint?: string }
  | { kind: "value"; key: string; label: string; required?: boolean; hint?: string }
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
  { kind: "text", key: "url", label: "URL", required: true, hint: "A path such as /join, a full URL, or mailto:" },
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
  hint: "Empty: this project on a project page, all shown projects on Home",
};

const limit: FieldSpec = { kind: "int", key: "limit", label: "Limit", nullable: true, hint: "Empty: no limit" };

export const blockInfo: Record<BlockType, BlockInfo> = {
  hero: {
    label: "Hero",
    kind: "content",
    description: "The top of a page: an image, video or slideshow with the title and buttons on top",
    fields: [
      { kind: "text", key: "subtitle", label: "Subtitle" },
      { kind: "text", key: "media_url", label: "Media URL", required: true, hint: "The image or video; for a slideshow, the first slide" },
      { kind: "enum", key: "media_kind", label: "Media kind", options: ["image", "video", "slideshow"] },
      { kind: "strings", key: "slides", label: "Slides", hint: "Slideshow only: the image URLs after the first, one per line" },
      { kind: "int", key: "slide_seconds", label: "Seconds per slide", nullable: true, hint: "Empty: the site's default" },
      buttons(false),
    ],
    defaults: () => ({ media_url: "" }),
  },
  article: {
    label: "Article",
    kind: "content",
    description: "A text section in Markdown, with an optional image",
    fields: [
      { kind: "text", key: "body", label: "Body (Markdown)", required: true, multiline: true },
      { kind: "text", key: "image", label: "Image URL", nullable: true },
      { kind: "enum", key: "image_side", label: "Image side", options: ["left", "right", "top"], nullable: true },
    ],
    defaults: () => ({ body: "", image: null, image_side: null }),
  },
  image: {
    label: "Image",
    kind: "content",
    description: "One picture; large runs full width (the team photo)",
    fields: [
      { kind: "text", key: "url", label: "Image URL", required: true },
      { kind: "text", key: "alt", label: "Alt text", hint: "What the picture shows, for screen readers" },
      { kind: "text", key: "caption", label: "Caption" },
      { kind: "text", key: "credit", label: "Credit" },
      { kind: "enum", key: "size", label: "Size", options: ["normal", "large"] },
    ],
    defaults: () => ({ url: "" }),
  },
  quote: {
    label: "Quote",
    kind: "content",
    description: "A quote over a background image or colour",
    fields: [
      { kind: "text", key: "text", label: "Quote", required: true, multiline: true },
      { kind: "text", key: "who", label: "Who", required: true },
      { kind: "text", key: "role", label: "Role" },
      { kind: "text", key: "background_image", label: "Background image URL", nullable: true },
      { kind: "text", key: "background_color", label: "Background colour", nullable: true },
    ],
    defaults: () => ({ text: "", who: "", background_image: null, background_color: null }),
  },
  gallery: {
    label: "Gallery",
    kind: "content",
    description: "Many images, each with a description",
    fields: [
      {
        kind: "items",
        key: "items",
        label: "Images",
        itemLabel: "Image",
        fields: [
          { kind: "text", key: "url", label: "Image URL", required: true },
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
    description: "One video or a series, e.g. documentary episodes",
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
    description: "Links as buttons: tickets, donate, LINE, apply, contact",
    fields: [buttons(true), { kind: "enum", key: "align", label: "Align", options: ["left", "center"] }],
    defaults: () => ({ buttons: [] }),
  },
  stats: {
    label: "Stats",
    kind: "content",
    description: "Confirmed numbers, e.g. members, shows",
    fields: [
      {
        kind: "items",
        key: "items",
        label: "Numbers",
        itemLabel: "Number",
        fields: [
          { kind: "text", key: "label", label: "Label", required: true },
          { kind: "value", key: "value", label: "Value", required: true, hint: "A number, or text" },
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
    description: "Events from projects.highlights",
    fields: [projectSlug, limit],
    defaults: () => ({ project_slug: null, limit: null }),
  },
  team: {
    label: "Team",
    kind: "data",
    description: "People from projects.team, grouped by department",
    fields: [
      projectSlug,
      { kind: "strings", key: "dept_keys", label: "Department keys", hint: "One track key per line. Empty: every department" },
      { kind: "bool", key: "show_org_chart", label: "Show the org chart" },
      { kind: "enum", key: "layout", label: "Layout", options: ["list", "yearbook"] },
    ],
    defaults: () => ({ project_slug: null, dept_keys: [], show_org_chart: false, layout: "list" }),
  },
  sponsors: {
    label: "Sponsors",
    kind: "data",
    description: "Sponsors from projects.sponsors; logos only where allowed",
    fields: [projectSlug, { kind: "strings", key: "tiers", label: "Tiers", hint: "One tier per line. Empty: every tier" }],
    defaults: () => ({ project_slug: null, tiers: [] }),
  },
  join: {
    label: "Join",
    kind: "data",
    description: "Recruitment rounds open today",
    fields: [projectSlug, { kind: "text", key: "empty_text", label: "Text when no round is open", multiline: true }],
    defaults: () => ({ project_slug: null }),
  },
  projects: {
    label: "Projects shelf",
    kind: "data",
    description: "The bookshelf of shown projects, newest first",
    fields: [limit],
    defaults: () => ({ limit: null }),
  },
  tracks: {
    label: "Tracks",
    kind: "data",
    description: "One card per shown track, by order. No settings of its own",
    fields: [],
    defaults: () => ({}),
  },
  yearbook: {
    label: "Yearbook cards",
    kind: "data",
    description: "Shown projects with a yearbook, newest first",
    fields: [limit],
    defaults: () => ({ limit: null }),
  },
};

/** `base`, or `base-2`, `base-3` ... : the first id not already used on the page. */
export function nextBlockId(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) if (!used.has(`${base}-${n}`)) return `${base}-${n}`;
}

/**
 * A new block of `type`, hidden until it is filled in, so a half-made block
 * never shows on the site.
 */
export function newBlock(type: BlockType, takenIds: Iterable<string>): Block {
  return {
    id: nextBlockId(type, takenIds),
    type,
    title: null,
    is_shown: false,
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
