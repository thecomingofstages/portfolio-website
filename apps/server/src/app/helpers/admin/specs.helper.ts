/**
 * The admin resources (task S6) and the checks each one runs (task S7).
 * Every write path below goes through crud.helper.ts with one of these specs.
 */
import type { Collection } from "mongodb";
import type { Models, ProjectDoc } from "../../models";
import { applySchema, positionSchema, timelineEventSchema } from "../../schemas/admin/apply.schema";
import { pageSchema } from "../../schemas/admin/page.schema";
import { highlightSchema, projectSchema, sponsorSchema, teamMemberSchema } from "../../schemas/admin/project.schema";
import { achievementSchema, trackSchema } from "../../schemas/admin/track.schema";
import {
  assertProjectDeletable,
  assertProjectSlugs,
  assertTrackDeletable,
  assertTrackKeys,
  checkBlocks,
  deleteUnusedPhotos,
  removedPhotos,
  renameProjectSlug,
  renameTrackKey,
} from "./checks.helper";
import type { Doc, DocSpec, ItemSpec } from "./crud.helper";

const col = (pick: (m: Models) => Collection<never>) => pick as unknown as (m: Models) => Collection<Doc>;
const team = (d: Doc | null) => (d?.team ?? []) as NonNullable<ProjectDoc["team"]>;
const strings = (list: unknown, field: string) =>
  (Array.isArray(list) ? list : []).flatMap((x: Doc) => (typeof x[field] === "string" ? [x[field] as string] : []));

// ---------------------------------------------------------------------------

export const projectSpec: DocSpec = {
  name: "project",
  collection: col((m) => m.projects as never),
  key: "slug",
  schema: projectSchema,
  sort: { start_date: -1 },
  itemLists: ["team", "sponsors", "highlights"],
  async beforeSave(m, doc, before) {
    await assertTrackKeys(m, strings(doc.team, "dept_key"), "team");
    // A project's own blocks may point at it, by its new slug or (while renaming) its old one.
    await checkBlocks(m, doc.blocks as never, [doc.slug as string, before?.slug as string | undefined]);
  },
  async afterSave(m, ctx, doc, before) {
    if (before && before.slug !== doc.slug) await renameProjectSlug(m, before.slug as string, doc.slug as string);
    if (before) await deleteUnusedPhotos(m, ctx, removedPhotos(team(before), team(doc)));
  },
  beforeDelete: (m, doc) => assertProjectDeletable(m, doc.slug as string),
  // A deleted project's team photos go too, unless another document still uses them.
  afterDelete: (m, ctx, doc) => deleteUnusedPhotos(m, ctx, team(doc).map((t) => t.photo)),
  checkBlocks: (m, blocks, parent) => checkBlocks(m, blocks as never, [parent.slug as string]),
};

export const teamSpec: ItemSpec = {
  name: "team member",
  parent: projectSpec,
  field: "team",
  schema: teamMemberSchema,
  check: (m, item) => assertTrackKeys(m, [item.dept_key as string], "team"),
  // Withdrawing consent (is_photo_allowed: false) removes the photo in the same request.
  mergePatch(stored, patch) {
    const merged = { ...stored, ...patch };
    if (merged.is_photo_allowed !== true && patch.photo === undefined) delete merged.photo;
    return merged;
  },
  afterChange: (m, ctx, before, after) =>
    deleteUnusedPhotos(m, ctx, before?.photo && before.photo !== after?.photo ? [before.photo as string] : []),
};

export const sponsorItemSpec: ItemSpec = { name: "sponsor", parent: projectSpec, field: "sponsors", schema: sponsorSchema };
export const highlightItemSpec: ItemSpec = { name: "highlight", parent: projectSpec, field: "highlights", schema: highlightSchema };

// ---------------------------------------------------------------------------

export const trackSpec: DocSpec = {
  name: "track",
  collection: col((m) => m.tracks as never),
  key: "key",
  schema: trackSchema,
  sort: { order: 1, key: 1 },
  itemLists: ["achievements"],
  beforeSave: (m, doc) => assertProjectSlugs(m, strings(doc.achievements, "project_slug"), "achievements"),
  async afterSave(m, _ctx, doc, before) {
    if (before && before.key !== doc.key) await renameTrackKey(m, before.key as string, doc.key as string);
  },
  beforeDelete: (m, doc) => assertTrackDeletable(m, doc.key as string),
};

export const achievementItemSpec: ItemSpec = {
  name: "achievement",
  parent: trackSpec,
  field: "achievements",
  schema: achievementSchema,
  check: (m, item) => assertProjectSlugs(m, [item.project_slug as string], "achievements"),
};

// ---------------------------------------------------------------------------

export const applySpec: DocSpec = {
  name: "apply round",
  collection: col((m) => m.apply as never),
  key: "_id",
  schema: applySchema,
  sort: { opens_at: -1 },
  itemLists: ["positions", "timeline"],
  async beforeSave(m, doc) {
    if (typeof doc.project_slug === "string") await assertProjectSlugs(m, [doc.project_slug], "project_slug");
    await assertTrackKeys(m, strings(doc.positions, "dept_key"), "positions");
  },
};

export const positionItemSpec: ItemSpec = {
  name: "position",
  parent: applySpec,
  field: "positions",
  schema: positionSchema,
  check: (m, item) => assertTrackKeys(m, [item.dept_key as string], "positions"),
};

export const timelineItemSpec: ItemSpec = { name: "timeline event", parent: applySpec, field: "timeline", schema: timelineEventSchema };

// ---------------------------------------------------------------------------

export const pageSpec: DocSpec = {
  name: "page",
  collection: col((m) => m.pages as never),
  key: "key",
  schema: pageSchema,
  sort: { key: 1 },
  touch: true,
  beforeSave: (m, doc) => checkBlocks(m, doc.blocks as never),
  checkBlocks: (m, blocks) => checkBlocks(m, blocks as never),
};
