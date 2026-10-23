/**
 * Field types for admin request bodies, mirroring tcos_schema.mongodb.js.
 * Every object is .strict(): unknown fields are rejected, as the database does
 * (additionalProperties: false). The database validator stays the second guard.
 *
 * Values arrive as JSON, so dates and ids are strings; they are converted here
 * (docs/API.md "Database access": no automatic conversion). Date and ObjectId
 * instances are accepted too, for PATCH, which merges with the stored document.
 */
import { ObjectId } from "mongodb";
import { z } from "zod";

export const str = z.string();
export const strOrNull = z.string().nullable();
export const bool = z.boolean();
export const strList = z.array(z.string());
export const pics = strList; // image URLs

/** int, minimum 0 (the schema's `int`). */
export const int = z.number().int().min(0);
/** int or null (the schema's `int_or_null`). */
export const intOrNull = z.number().int().nullable();

/** ISO 8601 date or date-time, e.g. "2025-06-28" or "2025-06-28T19:00:00+07:00", stored as a BSON Date. */
export const date = z.union([
  z.date(),
  z
    .string()
    .refine((s) => /^\d{4}-\d{2}-\d{2}([T ][\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.test(s) && !Number.isNaN(Date.parse(s)), {
      message: "must be an ISO 8601 date, e.g. 2025-06-28 or 2025-06-28T19:00:00+07:00",
    })
    .transform((s) => new Date(s)),
]);
export const dateOrNull = date.nullable();

/** A list item's `_id`: kept when given (PUT of a whole document), else the server adds one. */
export const itemId = z
  .union([z.instanceof(ObjectId), z.string().regex(/^[0-9a-f]{24}$/i, "must be a 24-character hex id")])
  .transform((v) => (typeof v === "string" ? new ObjectId(v) : v))
  .optional();

/** URL keys: lowercase letters, digits and hyphens (slug, tracks.key, pages.key). */
export const urlKey = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase letters, digits and hyphens");
