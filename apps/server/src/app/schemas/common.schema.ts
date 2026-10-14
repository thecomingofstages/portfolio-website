/**
 * Shared zod pieces for route schemas. One file per domain goes next to this one
 * (project.schema.ts, track.schema.ts ...), named after its route file.
 */
import { z } from "zod";

/** URL keys: lowercase letters, digits and hyphens, e.g. "tcos-2-the-hidden-saloon". */
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase letters, digits and hyphens");

/** A list item or document id from the URL; db.toObjectId converts it. */
export const objectId = z.string().regex(/^[0-9a-f]{24}$/i, "must be a 24-character hex id");

export const slugParams = z.object({ slug });
export const keyParams = z.object({ key: slug });
export const idParams = z.object({ id: objectId });
