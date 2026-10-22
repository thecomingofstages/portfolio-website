/** apply (recruitment rounds), their positions and timeline (tcos_schema.mongodb.js). */
import { z } from "zod";
import { bool, date, dateOrNull, intOrNull, itemId, str, strList, strOrNull } from "./fields.schema";

const audition = z
  .object({
    clip_required: bool.optional(),
    clip_brief: str.optional(),
    clip_max_minutes: intOrNull.optional(),
    clip_file_name: str.optional(),
    clip_upload: str.optional(),
    pieces: strList.optional(),
    onsite: bool.optional(),
  })
  .strict();

const positionFields = {
  dept_key: str,
  dept_name: str.optional(),
  unit_name: strOrNull.optional(),
  title: str,
  description: str.optional(),
  requirements: strList.optional(),
  portfolio_required: bool.optional(),
  onsite_required: bool.optional(),
  audition: audition.optional(),
  is_shown: bool,
};
export const positionSchema = z.object(positionFields).strict();

const timelineFields = {
  start_date: date,
  end_date: dateOrNull.optional(),
  event_name: str,
  event_description: str.optional(),
  location: strOrNull.optional(),
  is_shown: bool,
};
export const timelineEventSchema = z.object(timelineFields).strict();

export const applySchema = z
  .object({
    project_slug: strOrNull.optional(),
    title: str,
    opens_at: date,
    closes_at: date,
    extended_to: dateOrNull.optional(),
    qualifications: z
      .object({ age_min: intOrNull.optional(), age_max: intOrNull.optional(), age_note: strOrNull.optional(), items: strList.optional() })
      .strict()
      .optional(),
    positions: z.array(z.object({ _id: itemId, ...positionFields }).strict()),
    timeline: z.array(z.object({ _id: itemId, ...timelineFields }).strict()).optional(),
    apply_url: strOrNull.optional(),
    poster: strOrNull.optional(),
    is_shown: bool,
  })
  .strict();
