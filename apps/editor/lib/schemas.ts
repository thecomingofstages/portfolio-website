import { z } from "zod";

/**
 * The shapes the editor sends, checked before every save (docs/EDITOR.md
 * "Checks in the editor"). They follow tcos_schema.mongodb.js exactly: the same
 * required fields, enums and nullability, and no extra fields (`.strict()`).
 * The server checks again; these only catch mistakes next to the form.
 */

const str = z.string();
const strOrNull = z.string().nullable();
const int = z.number().int();
const intOrNull = int.nullable();
const strList = z.array(z.string());

/** `id` is also the #anchor, so it must not be empty or contain spaces. */
const blockId = z
  .string()
  .min(1, "id is empty")
  .regex(/^\S+$/, "id cannot contain spaces");

const button = z
  .object({ label: str, url: str, style: z.enum(["primary", "secondary"]).optional() })
  .strict();

function block<T extends string, S extends z.ZodRawShape>(type: T, shape: S) {
  return z
    .object({ id: blockId, type: z.literal(type), title: strOrNull.optional(), is_shown: z.boolean(), ...shape })
    .strict();
}

export const blockSchemas = {
  // Content blocks
  hero: block("hero", {
    subtitle: str.optional(),
    media_url: str,
    media_kind: z.enum(["image", "video", "slideshow"]).optional(),
    slides: strList.optional(),
    slide_seconds: intOrNull.optional(),
    buttons: z.array(button).optional(),
  }),
  article: block("article", {
    body: str,
    image: strOrNull.optional(),
    image_side: z.enum(["left", "right", "top"]).nullable().optional(),
  }),
  image: block("image", {
    url: str,
    alt: str.optional(),
    caption: str.optional(),
    credit: str.optional(),
    size: z.enum(["normal", "large"]).optional(),
  }),
  quote: block("quote", {
    text: str,
    who: str,
    role: str.optional(),
    background_image: strOrNull.optional(),
    background_color: strOrNull.optional(),
  }),
  gallery: block("gallery", {
    items: z.array(z.object({ url: str, alt: str.optional(), desc: str.optional() }).strict()),
  }),
  video: block("video", {
    videos: z.array(
      z
        .object({
          url: str,
          provider: z.enum(["youtube", "tiktok", "instagram", "drive"]),
          title: str.optional(),
          caption: str.optional(),
        })
        .strict(),
    ),
  }),
  button: block("button", {
    buttons: z.array(button),
    align: z.enum(["left", "center"]).optional(),
  }),
  stats: block("stats", {
    items: z.array(z.object({ label: str, value: z.union([z.number(), str]), note: str.optional() }).strict()),
  }),
  // Data blocks
  highlights: block("highlights", { project_slug: strOrNull.optional(), limit: intOrNull.optional() }),
  team: block("team", {
    project_slug: strOrNull.optional(),
    dept_keys: strList.optional(),
    show_org_chart: z.boolean().optional(),
    layout: z.enum(["list", "yearbook"]).optional(),
  }),
  sponsors: block("sponsors", { project_slug: strOrNull.optional(), tiers: strList.optional() }),
  join: block("join", { project_slug: strOrNull.optional(), empty_text: str.optional() }),
  projects: block("projects", { limit: intOrNull.optional() }),
  tracks: block("tracks", {}),
  yearbook: block("yearbook", { limit: intOrNull.optional() }),
};

export type BlockType = keyof typeof blockSchemas;
export const BLOCK_TYPES = Object.keys(blockSchemas) as BlockType[];

export const blockSchema = z.discriminatedUnion("type", [
  blockSchemas.hero,
  blockSchemas.article,
  blockSchemas.image,
  blockSchemas.quote,
  blockSchemas.gallery,
  blockSchemas.video,
  blockSchemas.button,
  blockSchemas.stats,
  blockSchemas.highlights,
  blockSchemas.team,
  blockSchemas.sponsors,
  blockSchemas.join,
  blockSchemas.projects,
  blockSchemas.tracks,
  blockSchemas.yearbook,
]);

/** A page's whole `blocks` array: each block valid, and `id`s unique within the page. */
export const blocksSchema = z.array(blockSchema).superRefine((blocks, ctx) => {
  const seen = new Set<string>();
  blocks.forEach((b, index) => {
    if (seen.has(b.id)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, "id"], message: `id "${b.id}" is used twice` });
    seen.add(b.id);
  });
});

// --- projects and pages -------------------------------------------------------

/** `YYYY-MM-DD`, or with a Bangkok time (lib/date-input.ts). The server turns it into a Date. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:00\+07:00)?$/, "use YYYY-MM-DD, with an optional time");

/** The URL key: lowercase letters, digits and single hyphens, e.g. tcos-2-the-hidden-saloon. */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use lowercase letters, digits and hyphens");

export const PROJECT_TYPES = ["stage_play", "mini_concert", "camp", "club", "workshop", "event", "central_team"] as const;
export const PROJECT_STATUSES = ["upcoming", "recruiting", "in_progress", "completed", "cancelled"] as const;

/** The project fields the editor changes (docs/EDITOR.md "What it edits"). */
export const projectFieldsSchema = z
  .object({
    slug: slugSchema,
    name: str.min(1, "name is empty"),
    type: z.enum(PROJECT_TYPES),
    status: z.enum(PROJECT_STATUSES),
    start_date: isoDate,
    end_date: isoDate.nullable(),
    venue: strOrNull,
    summary: str,
    cover: strOrNull,
    pics: strList,
    org_chart_image: strOrNull,
    is_yearbook_shown: z.boolean(),
    is_shown: z.boolean(),
  })
  .strict();

/** A new project: the fields the schema requires. */
export const newProjectSchema = projectFieldsSchema.pick({
  slug: true,
  name: true,
  type: true,
  status: true,
  start_date: true,
  is_shown: true,
});

export const pageFieldsSchema = z.object({ title: str.min(1, "title is empty"), is_shown: z.boolean() }).strict();

/** Readable lines for a failed check, e.g. "Block 3 (hero) › media_url: Required". */
export function describeIssues(error: z.ZodError, blocks?: readonly { type?: unknown }[]): string[] {
  return error.issues.map((issue) => {
    const [first, ...rest] = issue.path;
    if (blocks && typeof first === "number") {
      const type = typeof blocks[first]?.type === "string" ? ` (${blocks[first].type})` : "";
      const where = rest.length ? ` › ${rest.join(".")}` : "";
      return `Block ${first + 1}${type}${where}: ${issue.message}`;
    }
    return issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message;
  });
}

// --- tracks and recruitment rounds (tcos_schema.mongodb.js, the server's track.schema.ts and apply.schema.ts) ---

/** A list item's id: kept as sent, so the server keeps the item; a new item has none. */
const itemId = z.string().regex(/^[0-9a-f]{24}$/i, "not an item id").optional();
const nonNegativeInt = z.number().int().min(0, "use 0 or more");

const achievementFields = {
  project_slug: z.string().min(1, "project_slug is empty"),
  year: intOrNull.optional(),
  text: str.min(1, "text is empty"),
  pics: strList.optional(),
  is_shown: z.boolean(),
};

export const trackSchema = z
  .object({
    key: slugSchema,
    display_name: str.min(1, "display_name is empty"),
    desc: str.optional(),
    pics: strList.optional(),
    achievements: z.array(z.object({ _id: itemId, ...achievementFields }).strict()).optional(),
    order: nonNegativeInt.optional(),
    is_shown: z.boolean(),
  })
  .strict();

/** A new track: the fields the schema requires. */
export const newTrackSchema = trackSchema.pick({ key: true, display_name: true, is_shown: true });

const audition = z
  .object({
    clip_required: z.boolean().optional(),
    clip_brief: str.optional(),
    clip_max_minutes: intOrNull.optional(),
    clip_file_name: str.optional(),
    clip_upload: str.optional(),
    pieces: strList.optional(),
    onsite: z.boolean().optional(),
  })
  .strict();

const position = z
  .object({
    _id: itemId,
    dept_key: str,
    dept_name: str.optional(),
    unit_name: strOrNull.optional(),
    title: str.min(1, "title is empty"),
    description: str.optional(),
    requirements: strList.optional(),
    portfolio_required: z.boolean().optional(),
    onsite_required: z.boolean().optional(),
    audition: audition.optional(),
    is_shown: z.boolean(),
  })
  .strict();

const timelineEvent = z
  .object({
    _id: itemId,
    start_date: isoDate,
    end_date: isoDate.nullable().optional(),
    event_name: str.min(1, "event_name is empty"),
    event_description: str.optional(),
    location: strOrNull.optional(),
    is_shown: z.boolean(),
  })
  .strict();

export const roundSchema = z
  .object({
    project_slug: strOrNull.optional(),
    title: str.min(1, "title is empty"),
    opens_at: isoDate,
    closes_at: isoDate,
    extended_to: isoDate.nullable().optional(),
    qualifications: z
      .object({ age_min: intOrNull.optional(), age_max: intOrNull.optional(), age_note: strOrNull.optional(), items: strList.optional() })
      .strict()
      .optional(),
    positions: z.array(position),
    timeline: z.array(timelineEvent).optional(),
    apply_url: strOrNull.optional(),
    poster: strOrNull.optional(),
    is_shown: z.boolean(),
  })
  .strict();

/** A new round: the fields the schema requires; positions start empty. */
export const newRoundSchema = roundSchema.pick({ title: true, opens_at: true, closes_at: true, positions: true, is_shown: true });
