/**
 * Generic admin CRUD (task S6, docs/API.md "Admin API"). Each resource is described
 * by a spec (specs.helper.ts); its checks (S7) plug in through the spec's hooks.
 *
 * - Hidden documents and items are returned too: editors need to see them.
 * - PUT replaces; PATCH merges the body into the stored document, then is checked
 *   exactly like a PUT, so both go through the same validation.
 * - New list items get an `_id` (withId); a whole-document PUT keeps given item ids.
 */
import type { Collection, Document, ObjectId, Sort } from "mongodb";
import type { ZodTypeAny } from "zod";
import { toObjectId, withId } from "../../database/db";
import type { Models } from "../../models";
import { blocksSchema } from "../../schemas/admin/block.schema";
import { ApiError } from "../../utils/ApiError";
import type { WriteContext } from "./checks.helper";

export type Doc = Document & { _id?: ObjectId };
type Item = Document & { _id: ObjectId };

export type DocSpec = {
  /** For messages, e.g. "project". */
  name: string;
  collection: (m: Models) => Collection<Doc>;
  /** The URL key: slug, key, or _id. */
  key: "slug" | "key" | "_id";
  schema: ZodTypeAny;
  sort: Sort;
  /** List fields whose items carry an `_id`. */
  itemLists?: string[];
  /** Set `updated_at` on every write (pages). */
  touch?: boolean;
  /** S7 checks before a create/replace; `before` is null on create. */
  beforeSave?: (m: Models, doc: Doc, before: Doc | null) => Promise<void>;
  /** After a successful create/replace: rename cascades, photo cleanup. */
  afterSave?: (m: Models, ctx: WriteContext, doc: Doc, before: Doc | null) => Promise<void>;
  beforeDelete?: (m: Models, doc: Doc) => Promise<void>;
  afterDelete?: (m: Models, ctx: WriteContext, doc: Doc) => Promise<void>;
  /** Checks for a whole blocks array (resources with blocks). */
  checkBlocks?: (m: Models, blocks: Doc[], parent: Doc) => Promise<void>;
};

export type ItemSpec = {
  name: string;
  parent: DocSpec;
  field: string;
  schema: ZodTypeAny;
  check?: (m: Models, item: Item, parent: Doc) => Promise<void>;
  /** How a PATCH body merges into the stored item (default: shallow). */
  mergePatch?: (stored: Doc, patch: Doc) => Doc;
  /** After a create/replace/delete; `before` or `after` is null. */
  afterChange?: (m: Models, ctx: WriteContext, before: Item | null, after: Item | null) => Promise<void>;
};

function asObject(body: unknown): Doc {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw ApiError.badRequest("Request body must be a JSON object");
  return body as Doc;
}

const filterFor = (spec: DocSpec, id: string) => (spec.key === "_id" ? { _id: toObjectId(id) } : { [spec.key]: id });

/** A stored document without the fields the server manages, ready to merge a PATCH into. */
function editable(doc: Doc): Doc {
  const { _id, updated_at, ...rest } = doc;
  return rest;
}

/**
 * A request body without the fields the server manages, so what GET returned can be
 * edited and sent back (review on PR #28): `updated_at` is ignored; `_id` is accepted
 * when it is the id being edited, refused when it is another one, and refused on create.
 */
function serverFieldsRemoved(body: Doc, id: ObjectId | undefined, what: string): Doc {
  const { _id, updated_at, ...rest } = body;
  if (_id !== undefined) {
    if (!id) throw ApiError.badRequest(`_id: do not send one for a new ${what}; the server assigns it`);
    if (String(_id) !== id.toHexString()) throw ApiError.badRequest(`_id: does not match the ${what} being changed (${id.toHexString()})`);
  }
  return rest;
}

/** Parsed body with item ids added and updated_at set. */
function prepare(spec: DocSpec, raw: unknown): Doc {
  const doc = spec.schema.parse(raw) as Doc;
  for (const field of spec.itemLists ?? []) {
    if (Array.isArray(doc[field])) doc[field] = (doc[field] as Doc[]).map((it) => (it._id ? it : withId(it)));
  }
  if (spec.touch) doc.updated_at = new Date();
  return doc;
}

// ---------------------------------------------------------------------------
// Documents

export const listDocs = (m: Models, spec: DocSpec) => spec.collection(m).find({}).sort(spec.sort).toArray();

export async function getDoc(m: Models, spec: DocSpec, id: string): Promise<Doc> {
  const doc = await spec.collection(m).findOne(filterFor(spec, id));
  if (!doc) throw ApiError.notFound(`${spec.name} not found`);
  return doc;
}

async function assertKeyFree(m: Models, spec: DocSpec, value: unknown) {
  if (spec.key === "_id") return;
  if (await spec.collection(m).countDocuments({ [spec.key]: value }, { limit: 1 })) {
    throw ApiError.conflict(`${spec.name} with ${spec.key} "${String(value)}" already exists`);
  }
}

export async function createDoc(m: Models, ctx: WriteContext, spec: DocSpec, body: unknown) {
  const doc = prepare(spec, serverFieldsRemoved(asObject(body), undefined, spec.name));
  await assertKeyFree(m, spec, doc[spec.key]);
  await spec.beforeSave?.(m, doc, null);
  const { insertedId } = await spec.collection(m).insertOne(doc);
  const saved = { ...doc, _id: insertedId };
  await spec.afterSave?.(m, ctx, saved, null);
  return saved;
}

/** PUT (replace) or PATCH (merge, then replace). Renames go through afterSave. */
export async function replaceDoc(m: Models, ctx: WriteContext, spec: DocSpec, id: string, body: unknown, merge: boolean) {
  const before = await getDoc(m, spec, id);
  const sent = serverFieldsRemoved(asObject(body), before._id, spec.name);
  const doc = prepare(spec, merge ? { ...editable(before), ...sent } : sent);
  if (spec.key !== "_id" && doc[spec.key] !== before[spec.key]) await assertKeyFree(m, spec, doc[spec.key]);
  await spec.beforeSave?.(m, doc, before);
  await spec.collection(m).replaceOne({ _id: before._id }, doc);
  const saved = { ...doc, _id: before._id };
  await spec.afterSave?.(m, ctx, saved, before);
  return saved;
}

export async function deleteDoc(m: Models, ctx: WriteContext, spec: DocSpec, id: string) {
  const before = await getDoc(m, spec, id);
  await spec.beforeDelete?.(m, before);
  await spec.collection(m).deleteOne({ _id: before._id });
  await spec.afterDelete?.(m, ctx, before);
}

// ---------------------------------------------------------------------------
// List items (team, sponsors, highlights, achievements, positions, timeline)

const items = (parent: Doc, field: string) => (Array.isArray(parent[field]) ? (parent[field] as Item[]) : []);

export async function listItems(m: Models, spec: ItemSpec, id: string) {
  return items(await getDoc(m, spec.parent, id), spec.field);
}

async function findItem(m: Models, spec: ItemSpec, id: string, itemId: string) {
  const parent = await getDoc(m, spec.parent, id);
  const oid = toObjectId(itemId);
  const item = items(parent, spec.field).find((it) => it._id?.equals(oid));
  if (!item) throw ApiError.notFound(`${spec.name} not found`);
  return { parent, item };
}

export const getItem = async (m: Models, spec: ItemSpec, id: string, itemId: string) => (await findItem(m, spec, id, itemId)).item;

const touchSet = (spec: ItemSpec) => (spec.parent.touch ? { updated_at: new Date() } : {});

export async function createItem(m: Models, ctx: WriteContext, spec: ItemSpec, id: string, body: unknown) {
  const parent = await getDoc(m, spec.parent, id);
  const item = withId(spec.schema.parse(serverFieldsRemoved(asObject(body), undefined, spec.name)) as Doc) as Item;
  await spec.check?.(m, item, parent);
  await spec.parent.collection(m).updateOne(
    { _id: parent._id },
    { $push: { [spec.field]: item }, ...(spec.parent.touch ? { $set: touchSet(spec) } : {}) } as Document,
  );
  await spec.afterChange?.(m, ctx, null, item);
  return item;
}

export async function replaceItem(m: Models, ctx: WriteContext, spec: ItemSpec, id: string, itemId: string, body: unknown, merge: boolean) {
  const { parent, item: before } = await findItem(m, spec, id, itemId);
  const stored = editable(before);
  const sent = serverFieldsRemoved(asObject(body), before._id, spec.name);
  const raw = merge ? (spec.mergePatch ?? ((s, p) => ({ ...s, ...p })))(stored, sent) : sent;
  const item = { _id: before._id, ...(spec.schema.parse(raw) as Doc) } as Item;
  await spec.check?.(m, item, parent);
  await spec.parent.collection(m).updateOne(
    { _id: parent._id, [`${spec.field}._id`]: before._id },
    { $set: { [`${spec.field}.$`]: item, ...touchSet(spec) } },
  );
  await spec.afterChange?.(m, ctx, before, item);
  return item;
}

export async function deleteItem(m: Models, ctx: WriteContext, spec: ItemSpec, id: string, itemId: string) {
  const { parent, item: before } = await findItem(m, spec, id, itemId);
  await spec.parent.collection(m).updateOne(
    { _id: parent._id },
    { $pull: { [spec.field]: { _id: before._id } }, ...(spec.parent.touch ? { $set: touchSet(spec) } : {}) } as Document,
  );
  await spec.afterChange?.(m, ctx, before, null);
}

// ---------------------------------------------------------------------------
// blocks: the whole array in one save (reorder, add, remove, hide)

export async function getBlocks(m: Models, spec: DocSpec, id: string) {
  return items(await getDoc(m, spec, id), "blocks") as Doc[];
}

export async function saveBlocks(m: Models, spec: DocSpec, id: string, body: unknown) {
  const parent = await getDoc(m, spec, id);
  const blocks = blocksSchema.parse(body) as Doc[];
  await spec.checkBlocks?.(m, blocks, parent);
  await spec.collection(m).updateOne({ _id: parent._id }, { $set: { blocks, ...(spec.touch ? { updated_at: new Date() } : {}) } });
  return blocks;
}
