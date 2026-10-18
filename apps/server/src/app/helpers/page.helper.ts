/** Public pages that are not a project (task S3): Home now. */
import type { Models } from "../models";
import { fillBlocks } from "./blocks.helper";

/** GET /api/pages/home: the title and the shown blocks, data blocks filled in (S4). */
export async function getPage(m: Models, key: string, now: Date = new Date()) {
  const p = await m.pages.findOne({ key, is_shown: true }, { projection: { key: 1, title: 1, blocks: 1 } });
  if (!p) return null;
  return { key: p.key, title: p.title, blocks: await fillBlocks(m, p.blocks, { kind: "page" }, now) };
}
