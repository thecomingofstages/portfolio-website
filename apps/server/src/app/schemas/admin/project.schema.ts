/** projects and their list items (tcos_schema.mongodb.js). */
import { z } from "zod";
import { blocksSchema } from "./block.schema";
import { bool, date, dateOrNull, itemId, pics, str, strOrNull, urlKey } from "./fields.schema";

const teamFields = {
  name: str,
  nickname: str.optional(),
  dept_key: str,
  dept_name: str.optional(),
  position: str,
  photo: str.optional(),
  is_photo_allowed: bool.optional(),
  is_shown: bool,
};
/** A photo is only accepted when is_photo_allowed is true (the validator's `dependencies`). */
const photoNeedsConsent = (m: { photo?: string; is_photo_allowed?: boolean }) => m.photo === undefined || m.is_photo_allowed === true;
const photoMessage = { message: "a photo needs is_photo_allowed: true (consent first)", path: ["photo"] };

export const teamMemberSchema = z.object(teamFields).strict().refine(photoNeedsConsent, photoMessage);
const teamMemberInDoc = z.object({ _id: itemId, ...teamFields }).strict().refine(photoNeedsConsent, photoMessage);

const sponsorFields = { name: str, logo: strOrNull.optional(), logo_permission: bool.optional(), tier: strOrNull.optional(), is_shown: bool };
export const sponsorSchema = z.object(sponsorFields).strict();

const highlightFields = { event_name: str, date: dateOrNull.optional(), venue: strOrNull.optional(), desc: str.optional(), pics: pics.optional(), is_shown: bool };
export const highlightSchema = z.object(highlightFields).strict();

export const projectSchema = z
  .object({
    slug: urlKey,
    name: str,
    type: z.enum(["stage_play", "mini_concert", "camp", "club", "workshop", "event", "central_team"]),
    status: z.enum(["upcoming", "recruiting", "in_progress", "completed", "cancelled"]),
    start_date: date,
    end_date: dateOrNull.optional(),
    venue: strOrNull.optional(),
    summary: str.optional(),
    org_chart_image: strOrNull.optional(),
    cover: strOrNull.optional(),
    pics: pics.optional(),
    team: z.array(teamMemberInDoc).optional(),
    sponsors: z.array(z.object({ _id: itemId, ...sponsorFields }).strict()).optional(),
    highlights: z.array(z.object({ _id: itemId, ...highlightFields }).strict()).optional(),
    blocks: blocksSchema.optional(),
    is_yearbook_shown: bool.optional(),
    is_shown: bool,
  })
  .strict();
