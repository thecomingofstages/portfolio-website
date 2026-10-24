/**
 * Uploads (task S8, docs/API.md "Uploads"): files stream from the request into the
 * site media bucket (MEDIA_BUCKET), with no disk step.
 *
 * R2 needs the length of a streamed body up front, which a multipart upload does not
 * give, so large files go through R2's own multipart upload: the stream is cut into
 * 5 MiB parts as it arrives, so memory stays bounded. A file under one part is a single put.
 *
 * Object keys: <collection>/<slug or key or _id>/<random id>.<ext>. The random id keeps
 * people's names out of URLs.
 */
import type { Readable } from "node:stream";
import { ApiError } from "../../utils/ApiError";

/** R2's minimum size for every part but the last. */
export const PART_SIZE = 5 * 1024 * 1024;

/**
 * Allowed file types, recognised from the file's first bytes (its "magic number"),
 * never from its name or declared type.
 * TODO(uploads): images only until the lead decides (API.md open question 1: video for the hero?).
 * SVG and HTML stay out: on a public bucket they can run scripts in visitors' browsers.
 */
const TYPES: { ext: string; mime: string; test: (b: Uint8Array) => boolean }[] = [
  { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", test: (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v) },
  { ext: "gif", mime: "image/gif", test: (b) => ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a" },
  { ext: "webp", mime: "image/webp", test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP" },
  { ext: "avif", mime: "image/avif", test: (b) => ascii(b, 4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(b, 8, 12)) },
];
/** Bytes needed to recognise every type above. */
const SNIFF = 12;

/** Bytes in one megabyte, for FILE_SIZE_LIMIT (set in MB, e.g. 50). */
export const MB = 1024 * 1024;

const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));

export function detectType(head: Uint8Array) {
  return TYPES.find((t) => t.test(head)) ?? null;
}

export const ALLOWED_TYPES = TYPES.map((t) => t.mime);

/** The folders a file may go in: one per collection. */
export const COLLECTIONS = ["projects", "tracks", "apply", "pages"] as const;
export type UploadCollection = (typeof COLLECTIONS)[number];

/** A random id for the file name: 128 bits, hex. */
const randomId = () => [...crypto.getRandomValues(new Uint8Array(16))].map((x) => x.toString(16).padStart(2, "0")).join("");

function concat(chunks: Uint8Array[], total: number) {
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/**
 * Streams one file into R2 under `<folder>/<random id>.<ext>`.
 * Throws 400 for an empty file, a type that is not allowed, or an upload cut off
 * midway; 413 above `maxBytes` (FILE_SIZE_LIMIT). Nothing is left in R2 when it fails:
 * a started multipart upload is always aborted (review on PR #33).
 */
export async function streamToR2(
  bucket: R2Bucket,
  folder: string,
  file: Readable,
  maxBytes: number,
): Promise<{ key: string; size: number; mime: string }> {
  let type: ReturnType<typeof detectType> = null;
  let key = "";
  let upload: R2MultipartUpload | null = null;
  const parts: R2UploadedPart[] = [];
  let pending: Uint8Array[] = [];
  let pendingBytes = 0;
  let size = 0;

  /** Sends one part: exactly PART_SIZE bytes (R2 needs all parts but the last to be the same size), or the rest at the end. */
  const flushPart = async (last = false) => {
    const all = concat(pending, pendingBytes);
    const body = last ? all : all.subarray(0, PART_SIZE);
    const rest = last ? new Uint8Array(0) : all.subarray(PART_SIZE);
    pending = rest.length ? [rest] : [];
    pendingBytes = rest.length;
    upload ??= await bucket.createMultipartUpload(key, { httpMetadata: { contentType: type!.mime } });
    parts.push(await upload.uploadPart(parts.length + 1, body));
  };

  try {
    // A refused file is remembered, not thrown mid-stream: the rest of the request is
    // still read (and dropped), so the client gets its answer instead of a hung upload.
    let failure: unknown = null;
    try {
      for await (const chunk of file as AsyncIterable<Uint8Array>) {
        if (failure) continue;
        try {
          size += chunk.length;
          if (size > maxBytes) throw new ApiError(413, `File too large (limit ${Math.round(maxBytes / MB)} MB)`);
          pending.push(chunk);
          pendingBytes += chunk.length;

          if (!type && pendingBytes >= SNIFF) {
            type = detectType(concat(pending, pendingBytes).subarray(0, SNIFF));
            if (!type) throw ApiError.badRequest(`file: type not allowed (allowed: ${ALLOWED_TYPES.join(", ")})`);
            key = `${folder}/${randomId()}.${type.ext}`;
          }
          while (type && pendingBytes >= PART_SIZE) await flushPart();
        } catch (err) {
          failure = err;
          pending = [];
          pendingBytes = 0;
        }
      }
    } catch {
      // The file stream itself failed: the client disconnected or the body was cut off.
      throw ApiError.badRequest("Upload interrupted: the file did not arrive completely");
    }

    if (failure) throw failure;
    if (size === 0) throw ApiError.badRequest("file: empty");
    if (!type) throw ApiError.badRequest(`file: type not allowed (allowed: ${ALLOWED_TYPES.join(", ")})`);

    if (upload === null) {
      // Small file: one put, with its length known.
      await bucket.put(key, concat(pending, pendingBytes), { httpMetadata: { contentType: (type as { mime: string }).mime } });
    } else {
      if (pendingBytes > 0) await flushPart(true);
      await (upload as R2MultipartUpload).complete(parts);
    }
    return { key, size, mime: (type as { mime: string }).mime };
  } catch (err) {
    if (upload) await (upload as R2MultipartUpload).abort().catch(() => {});
    throw err;
  }
}

/** An object key that this API could have made: no "..", no leading slash, in one of the collections. */
export function isMediaKey(key: string): boolean {
  return /^(projects|tracks|apply|pages)\/[A-Za-z0-9_-]+\/[0-9a-f]{32}\.(jpg|png|gif|webp|avif)$/.test(key);
}
