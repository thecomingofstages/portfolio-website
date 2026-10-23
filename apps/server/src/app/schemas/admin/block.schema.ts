/** block_component (tcos_schema.mongodb.js): exactly one shape per block type. */
import { z } from "zod";
import { bool, intOrNull, pics, str, strList, strOrNull } from "./fields.schema";

const button = z.object({ label: str, url: str, style: z.enum(["primary", "secondary"]).optional() }).strict();

const base = { id: str.min(1), title: strOrNull.optional(), is_shown: bool };
const block = <T extends string, S extends z.ZodRawShape>(type: T, shape: S) =>
  z.object({ ...base, type: z.literal(type), ...shape }).strict();

export const blockSchema = z.discriminatedUnion("type", [
  // Content blocks
  block("hero", {
    subtitle: str.optional(),
    media_url: str,
    media_kind: z.enum(["image", "video", "slideshow"]).optional(),
    slides: pics.optional(),
    slide_seconds: intOrNull.optional(),
    buttons: z.array(button).optional(),
  }),
  block("article", { body: str, image: strOrNull.optional(), image_side: z.enum(["left", "right", "top"]).nullable().optional() }),
  block("image", { url: str, alt: str.optional(), caption: str.optional(), credit: str.optional(), size: z.enum(["normal", "large"]).optional() }),
  block("quote", { text: str, who: str, role: str.optional(), background_image: strOrNull.optional(), background_color: strOrNull.optional() }),
  block("gallery", { items: z.array(z.object({ url: str, alt: str.optional(), desc: str.optional() }).strict()) }),
  block("video", {
    videos: z.array(
      z.object({ url: str, provider: z.enum(["youtube", "tiktok", "instagram", "drive"]), title: str.optional(), caption: str.optional() }).strict(),
    ),
  }),
  block("button", { buttons: z.array(button), align: z.enum(["left", "center"]).optional() }),
  block("stats", {
    items: z.array(z.object({ label: str, value: z.union([z.number(), z.string()]), note: str.optional() }).strict()),
  }),
  // Data blocks
  block("highlights", { project_slug: strOrNull.optional(), limit: intOrNull.optional() }),
  block("team", {
    project_slug: strOrNull.optional(),
    dept_keys: strList.optional(),
    show_org_chart: bool.optional(),
    layout: z.enum(["list", "yearbook"]).optional(),
  }),
  block("sponsors", { project_slug: strOrNull.optional(), tiers: strList.optional() }),
  block("join", { project_slug: strOrNull.optional(), empty_text: str.optional() }),
  block("projects", { limit: intOrNull.optional() }),
  block("tracks", {}),
  block("yearbook", { limit: intOrNull.optional() }),
]);

export const blocksSchema = z.array(blockSchema);
