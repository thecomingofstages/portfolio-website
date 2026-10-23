/** tracks (สายงาน) and their achievements (tcos_schema.mongodb.js). */
import { z } from "zod";
import { bool, int, intOrNull, itemId, pics, str, urlKey } from "./fields.schema";

const achievementFields = { project_slug: str, year: intOrNull.optional(), text: str, pics: pics.optional(), is_shown: bool };
export const achievementSchema = z.object(achievementFields).strict();

export const trackSchema = z
  .object({
    key: urlKey,
    display_name: str,
    desc: str.optional(),
    pics: pics.optional(),
    achievements: z.array(z.object({ _id: itemId, ...achievementFields }).strict()).optional(),
    order: int.optional(),
    is_shown: bool,
  })
  .strict();
