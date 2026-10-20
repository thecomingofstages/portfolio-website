"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as admin from "@/lib/admin-api";
import { AdminApiError } from "@/lib/admin-api";
import { blocksSchema, describeIssues, newProjectSchema, pageFieldsSchema, projectFieldsSchema } from "@/lib/schemas";
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
  try {
    if (target.kind === "page") await admin.savePageBlocks(target.key, parsed.data);
    else await admin.saveProjectBlocks(target.slug, parsed.data);
  } catch (error) {
    return failure(error);
  }
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
  try {
    await admin.updateProject(slug, parsed.data);
  } catch (error) {
    return failure(error);
  }
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
