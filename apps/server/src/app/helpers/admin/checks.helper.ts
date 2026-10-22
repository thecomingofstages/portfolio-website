/**
 * Checks on every write (task S7, docs/API.md "Checks on every write"):
 * what the database validator cannot check.
 *
 * - Block ids are unique within a page's blocks.
 * - Every dept_key matches a tracks.key; every project_slug matches a project
 *   (null is allowed in data blocks and apply).
 * - A project or track still referenced cannot be deleted (409).
 * - Renaming a slug or key updates its references in the same request.
 * - A photo that is withdrawn (consent removed) or replaced is deleted from R2.
 */
import type { Models, ProjectDoc } from "../../models";
import { ApiError } from "../../utils/ApiError";
import { Logger } from "../../utils/Logger";

type Block = { id: string; type: string; project_slug?: string | null; dept_keys?: string[] };

/** What a write needs from the environment: R2, to delete photos. */
export type WriteContext = { bucket: R2Bucket; mediaBaseUrl: string };

// ---------------------------------------------------------------------------
// Blocks

export function assertUniqueBlockIds(blocks: readonly Block[] | undefined) {
  const seen = new Set<string>();
  for (const b of blocks ?? []) {
    if (seen.has(b.id)) throw ApiError.badRequest(`blocks: id "${b.id}" is used twice (ids must be unique within a page)`);
    seen.add(b.id);
  }
}

export const blockProjectSlugs = (blocks: readonly Block[] | undefined) =>
  (blocks ?? []).flatMap((b) => (typeof b.project_slug === "string" ? [b.project_slug] : []));

export const blockDeptKeys = (blocks: readonly Block[] | undefined) => (blocks ?? []).flatMap((b) => b.dept_keys ?? []);

// ---------------------------------------------------------------------------
// References must exist

async function missing(found: Promise<string[]>, wanted: readonly string[]) {
  const have = new Set(await found);
  return [...new Set(wanted)].filter((w) => !have.has(w));
}

/** Every dept_key must match a tracks.key. */
export async function assertTrackKeys(m: Models, keys: readonly string[], where: string) {
  if (keys.length === 0) return;
  const unknown = await missing(m.tracks.distinct("key", { key: { $in: [...new Set(keys)] } }), keys);
  if (unknown.length) throw ApiError.badRequest(`${where}: dept_key ${unknown.map((k) => `"${k}"`).join(", ")} does not match a track`);
}

/** Every project_slug must match a project (hidden projects count: they exist). */
export async function assertProjectSlugs(m: Models, slugs: readonly string[], where: string) {
  if (slugs.length === 0) return;
  const unknown = await missing(m.projects.distinct("slug", { slug: { $in: [...new Set(slugs)] } }), slugs);
  if (unknown.length) throw ApiError.badRequest(`${where}: project_slug ${unknown.map((s) => `"${s}"`).join(", ")} does not match a project`);
}

/**
 * The block checks for one page's blocks. `self` lists the slugs of the project the
 * blocks belong to (its new and old slug while renaming): pointing at itself is fine.
 */
export async function checkBlocks(m: Models, blocks: readonly Block[] | undefined, self: readonly (string | undefined)[] = []) {
  assertUniqueBlockIds(blocks);
  await assertProjectSlugs(m, blockProjectSlugs(blocks).filter((s) => !self.includes(s)), "blocks");
  await assertTrackKeys(m, blockDeptKeys(blocks), "blocks");
}

// ---------------------------------------------------------------------------
// Deleting: refused while something still points to it

function refuse(what: string, uses: Record<string, number>) {
  const where = Object.entries(uses)
    .filter(([, n]) => n > 0)
    .map(([place, n]) => `${place} (${n})`);
  if (where.length) throw ApiError.conflict(`${what} is still referenced by: ${where.join(", ")}. Remove those references first.`);
}

export async function assertProjectDeletable(m: Models, slug: string) {
  refuse(`project "${slug}"`, {
    "tracks.achievements": await m.tracks.countDocuments({ "achievements.project_slug": slug }),
    apply: await m.apply.countDocuments({ project_slug: slug }),
    "projects.blocks": await m.projects.countDocuments({ slug: { $ne: slug }, "blocks.project_slug": slug }),
    "pages.blocks": await m.pages.countDocuments({ "blocks.project_slug": slug }),
  });
}

export async function assertTrackDeletable(m: Models, key: string) {
  refuse(`track "${key}"`, {
    "projects.team": await m.projects.countDocuments({ "team.dept_key": key }),
    "apply.positions": await m.apply.countDocuments({ "positions.dept_key": key }),
    "projects.blocks": await m.projects.countDocuments({ "blocks.dept_keys": key }),
    "pages.blocks": await m.pages.countDocuments({ "blocks.dept_keys": key }),
  });
}

// ---------------------------------------------------------------------------
// Renaming: references follow

export async function renameProjectSlug(m: Models, from: string, to: string) {
  await m.tracks.updateMany(
    { "achievements.project_slug": from },
    { $set: { "achievements.$[a].project_slug": to } },
    { arrayFilters: [{ "a.project_slug": from }] },
  );
  await m.apply.updateMany({ project_slug: from }, { $set: { project_slug: to } });
  for (const pages of [m.projects, m.pages] as const) {
    await (pages as typeof m.projects).updateMany(
      { "blocks.project_slug": from },
      { $set: { "blocks.$[b].project_slug": to } },
      { arrayFilters: [{ "b.project_slug": from }] },
    );
  }
}

export async function renameTrackKey(m: Models, from: string, to: string) {
  await m.projects.updateMany({ "team.dept_key": from }, { $set: { "team.$[t].dept_key": to } }, { arrayFilters: [{ "t.dept_key": from }] });
  await m.apply.updateMany(
    { "positions.dept_key": from },
    { $set: { "positions.$[p].dept_key": to } },
    { arrayFilters: [{ "p.dept_key": from }] },
  );
  for (const pages of [m.projects, m.pages] as const) {
    await (pages as typeof m.projects).updateMany(
      { "blocks.dept_keys": from },
      { $set: { "blocks.$[b].dept_keys.$[k]": to } },
      { arrayFilters: [{ "b.dept_keys": from }, { k: from }] },
    );
  }
}

// ---------------------------------------------------------------------------
// Photos: withdrawn or replaced photos leave R2 too

/** The R2 object key of a URL in the site media bucket, or null for any other URL. */
export function mediaKey(url: string | undefined | null, mediaBaseUrl: string): string | null {
  if (!url) return null;
  const base = mediaBaseUrl.replace(/\/+$/, "") + "/";
  if (!base.startsWith("http") || !url.startsWith(base)) return null;
  const key = decodeURIComponent(url.slice(base.length));
  return key && !key.includes("..") ? key : null;
}

/** Deletes these photo URLs from R2 (skipping ones that are not in the media bucket). */
export async function deletePhotos(ctx: WriteContext, urls: readonly (string | undefined)[]) {
  const keys = urls.map((u) => mediaKey(u, ctx.mediaBaseUrl)).filter((k): k is string => k !== null);
  if (keys.length === 0) return;
  try {
    await ctx.bucket.delete(keys);
  } catch (err) {
    // The database no longer points to the file; log (without names or URLs) so it can be cleaned up.
    Logger.error("R2: could not delete photo files", err, { count: keys.length });
  }
}

/** Photos in `before` that are gone or replaced in `after` (matched by team member _id). */
export function removedPhotos(before: ProjectDoc["team"], after: ProjectDoc["team"]): string[] {
  const now = new Map((after ?? []).map((m) => [String(m._id), m.photo]));
  return (before ?? []).flatMap((m) => (m.photo && now.get(String(m._id)) !== m.photo ? [m.photo] : []));
}
