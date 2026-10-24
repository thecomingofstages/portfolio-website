/**
 * POST /api/admin/uploads?collection=<projects|tracks|apply|pages>&owner=<slug, key or _id>
 *   multipart/form-data with one field named `file` → 201 { key, url }
 * DELETE /api/admin/uploads/<key> → 204 (409 while a document still points to the file)
 *
 * The owner must exist, so files are always filed under a real project, track,
 * round or page. The URL goes into pics, photo, logo, poster, slides, media_url and so on
 * with the normal admin routes.
 */
import busboy from "busboy";
import type { Request, RequestHandler } from "express";
import { isUrlReferenced } from "../../helpers/admin/checks.helper";
import { COLLECTIONS, isMediaKey, streamToR2, type UploadCollection } from "../../helpers/admin/upload.helper";
import { toObjectId } from "../../database/db";
import type { Models } from "../../models";
import { ApiError } from "../../utils/ApiError";
import { getConfig } from "../../utils/config";
import { query } from "../../utils/public";

const mediaUrl = (base: string, key: string) => `${base.replace(/\/+$/, "")}/${key}`;

async function assertOwnerExists(m: Models, collection: UploadCollection, owner: string) {
  const filter =
    collection === "apply" ? { _id: toObjectId(owner) } : collection === "projects" ? { slug: owner } : { key: owner };
  const found = await (m[collection] as unknown as { countDocuments(f: object, o: object): Promise<number> }).countDocuments(filter, { limit: 1 });
  if (!found) throw ApiError.badRequest(`owner: no ${collection} document "${owner}"`);
}

/**
 * Reads the request with busboy and streams its single `file` field to R2.
 * Exactly one part is allowed: a field named `file`. Busboy's own limits only stop floods.
 */
function receiveFile(req: Request, bucket: R2Bucket, folder: string) {
  return new Promise<{ key: string; size: number; mime: string }>((resolve, reject) => {
    let bb: busboy.Busboy;
    try {
      bb = busboy({ headers: req.headers, limits: { files: 2, fields: 2, parts: 4 } });
    } catch {
      return reject(ApiError.badRequest("Send the file as multipart/form-data, in a field named file"));
    }
    let saving: Promise<{ key: string; size: number; mime: string }> | null = null;
    let problem: ApiError | null = null;
    const refuse = (message: string) => (problem ??= ApiError.badRequest(message));

    bb.on("file", (name, file) => {
      if (name !== "file") {
        refuse(`Unexpected field "${name}": send the file in a field named file`);
        return file.resume();
      }
      if (saving) {
        refuse("Send exactly one file");
        return file.resume();
      }
      saving = streamToR2(bucket, folder, file);
      saving.catch(() => {}); // handled on close
    });
    bb.on("field", (name) => refuse(`Unexpected field "${name}": collection and owner go in the URL`));
    bb.on("partsLimit", () => refuse("Too many parts: send one file"));
    bb.on("error", () => refuse("Malformed multipart body"));
    bb.on("close", async () => {
      if (!saving) return reject(problem ?? ApiError.badRequest("No file: send it in a field named file"));
      try {
        const saved = await saving;
        if (problem) {
          // The file was stored but the request was not clean: do not keep it.
          await bucket.delete(saved.key);
          return reject(problem);
        }
        resolve(saved);
      } catch (err) {
        reject(err);
      }
    });
    req.pipe(bb);
  });
}

export const UploadController = {
  create: (async (req, res) => {
    const collection = String(req.query.collection ?? "") as UploadCollection;
    const owner = String(req.query.owner ?? "");
    if (!COLLECTIONS.includes(collection)) throw ApiError.badRequest(`collection: must be one of ${COLLECTIONS.join(", ")}`);
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(owner)) throw ApiError.badRequest("owner: the slug, key or _id the file belongs to");
    await query(req, (m) => assertOwnerExists(m, collection, owner));

    const config = getConfig(req);
    const saved = await receiveFile(req, config.MEDIA_BUCKET, `${collection}/${owner}`);
    res.status(201).json({ key: saved.key, url: mediaUrl(config.MEDIA_BASE_URL, saved.key) });
  }) satisfies RequestHandler,

  remove: (async (req, res) => {
    const key = ([] as string[]).concat(req.params.key ?? []).join("/");
    if (!isMediaKey(key)) throw ApiError.notFound("file not found");
    const config = getConfig(req);
    const url = mediaUrl(config.MEDIA_BASE_URL, key);
    if (await query(req, (m) => isUrlReferenced(m, url))) {
      throw ApiError.conflict("file is still used by a document; remove it there first");
    }
    if (!(await config.MEDIA_BUCKET.head(key))) throw ApiError.notFound("file not found");
    await config.MEDIA_BUCKET.delete(key);
    res.status(204).end();
  }) satisfies RequestHandler,
};
