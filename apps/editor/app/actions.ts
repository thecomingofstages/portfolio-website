"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as admin from "@/lib/admin-api";
import { AdminApiError } from "@/lib/admin-api";
import { mediaUrlsIn } from "@/lib/media";
import {
  blocksSchema,
  describeIssues,
  newProjectSchema,
  newRoundSchema,
  newTrackSchema,
  pageFieldsSchema,
  projectFieldsSchema,
  roundSchema,
  trackSchema,
} from "@/lib/schemas";
import type { ActionResult, BlocksTarget } from "@/types/admin";

/**
 * Every write the editor makes. Each one checks its input with the zod schemas
 * first, then calls the admin API. Server actions can be called by any POST to
 * the editor, so they never trust what the browser sends.
 * The editor itself has no sign-in: TODO(editor access), see docs/EDITOR.md.
 */

function failure(error: unknown): ActionResult {
  if (error instanceof AdminApiError) return { ok: false, errors: [error.message] };
  throw error;
}

/** Media URLs in `before` that `after` no longer has: the files a save removed or replaced. */
function removedMedia(before: unknown, after: unknown): string[] {
  const kept = new Set(mediaUrlsIn(after));
  return mediaUrlsIn(before).filter((url) => !kept.has(url));
}

const targetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("page"), key: z.string().min(1) }).strict(),
  z.object({ kind: z.literal("project"), slug: z.string().min(1) }).strict(),
]);

/** Saves a page's or a project's whole `blocks` array. */
export async function saveBlocks(rawTarget: BlocksTarget, blocks: unknown): Promise<ActionResult> {
  const target = targetSchema.parse(rawTarget);
  const parsed = blocksSchema.safeParse(blocks);
  if (!parsed.success) {
    return { ok: false, errors: describeIssues(parsed.error, Array.isArray(blocks) ? blocks : undefined) };
  }
  let removed: string[];
  try {
    const before = target.kind === "page" ? await admin.getPage(target.key) : await admin.getProject(target.slug);
    if (target.kind === "page") await admin.savePageBlocks(target.key, parsed.data);
    else await admin.saveProjectBlocks(target.slug, parsed.data);
    removed = removedMedia(before?.blocks, parsed.data);
  } catch (error) {
    return failure(error);
  }
  await admin.deleteUnusedMedia(removed);
  refresh();
  return { ok: true, message: "Blocks saved" };
}

export async function savePageFields(key: string, fields: unknown): Promise<ActionResult> {
  const parsed = pageFieldsSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, errors: describeIssues(parsed.error) };
  try {
    await admin.updatePage(key, parsed.data);
  } catch (error) {
    return failure(error);
  }
  refresh();
  return { ok: true, message: "Page saved" };
}

/** Saves a project's own fields. A new slug moves the editor to the new address. */
export async function saveProjectFields(slug: string, fields: unknown): Promise<ActionResult> {
  const parsed = projectFieldsSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, errors: describeIssues(parsed.error) };
  let removed: string[];
  try {
    const before = await admin.getProject(slug);
    await admin.updateProject(slug, parsed.data);
    removed = removedMedia(before && { pics: before.pics, org_chart_image: before.org_chart_image }, parsed.data);
  } catch (error) {
    return failure(error);
  }
  await admin.deleteUnusedMedia(removed);
  if (parsed.data.slug !== slug) redirect(`/projects/${encodeURIComponent(parsed.data.slug)}`);
  refresh();
  return { ok: true, message: "Project saved" };
}

export async function createProject(fields: unknown): Promise<ActionResult> {
  const parsed = newProjectSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, errors: describeIssues(parsed.error) };
  try {
    await admin.createProject(parsed.data);
  } catch (error) {
    return failure(error);
  }
  redirect(`/projects/${encodeURIComponent(parsed.data.slug)}`);
}

/** Saves a whole track. A new key moves the editor to the new address. */
export async function saveTrack(key: string, track: unknown): Promise<ActionResult> {
  const parsed = trackSchema.safeParse(track);
  if (!parsed.success) return { ok: false, errors: describeIssues(parsed.error) };
  let removed: string[];
  try {
    const before = await admin.getTrack(key);
    await admin.saveTrack(key, parsed.data);
    removed = removedMedia(before, parsed.data);
  } catch (error) {
    return failure(error);
  }
  await admin.deleteUnusedMedia(removed);
  if (parsed.data.key !== key) redirect(`/tracks/${encodeURIComponent(parsed.data.key)}`);
  refresh();
  return { ok: true, message: "Track saved" };
}

export async function createTrack(fields: unknown): Promise<ActionResult> {
  const parsed = newTrackSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, errors: describeIssues(parsed.error) };
  try {
    await admin.createTrack(parsed.data);
  } catch (error) {
    return failure(error);
  }
  redirect(`/tracks/${encodeURIComponent(parsed.data.key)}`);
}

/** Saves a whole recruitment round. */
export async function saveRound(id: string, round: unknown): Promise<ActionResult> {
  const parsed = roundSchema.safeParse(round);
  if (!parsed.success) return { ok: false, errors: describeIssues(parsed.error) };
  let removed: string[];
  try {
    const roundId = z.string().regex(/^[0-9a-f]{24}$/i).parse(id);
    const before = await admin.getRound(roundId);
    await admin.saveRound(roundId, parsed.data);
    removed = removedMedia(before, parsed.data);
  } catch (error) {
    return failure(error);
  }
  await admin.deleteUnusedMedia(removed);
  refresh();
  return { ok: true, message: "Round saved" };
}

export async function createRound(fields: unknown): Promise<ActionResult> {
  const parsed = newRoundSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, errors: describeIssues(parsed.error) };
  let id: string;
  try {
    id = (await admin.createRound(parsed.data))._id;
  } catch (error) {
    return failure(error);
  }
  redirect(`/apply/${encodeURIComponent(id)}`);
}
