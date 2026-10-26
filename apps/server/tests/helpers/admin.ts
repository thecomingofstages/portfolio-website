/**
 * Calls to the admin API in tests: a valid token, and a fake R2 bucket that
 * records which files the server deleted.
 */
import { SignJWT } from "jose";
import request from "supertest";
import type { useTestDb } from "./db";
import type { Config } from "../../src/app/config/init";
import { testConfig } from "./app";

export const MEDIA = "https://media.test";

export async function adminClient(db: ReturnType<typeof useTestDb>, overrides: Partial<Config> = {}) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("tester")
    .sign(new TextEncoder().encode(testConfig().JWT_SECRET));

  const deleted: string[] = [];
  /** Files in the fake bucket: key → bytes and content type. */
  const stored = new Map<string, { bytes: Uint8Array; type?: string; parts: number }>();
  const multipart = { started: 0, aborted: 0, failPart: 0 };
  const join = (list: Uint8Array[]) => {
    const out = new Uint8Array(list.reduce((n, b) => n + b.length, 0));
    let at = 0;
    for (const b of list) (out.set(b, at), (at += b.length));
    return out;
  };
  const bucket = {
    delete: async (keys: string | string[]) => {
      for (const k of [keys].flat()) (deleted.push(k), stored.delete(k));
    },
    head: async (key: string) => (stored.has(key) ? { key } : null),
    put: async (key: string, body: Uint8Array, opts?: { httpMetadata?: { contentType?: string } }) => {
      stored.set(key, { bytes: new Uint8Array(body), type: opts?.httpMetadata?.contentType, parts: 1 });
    },
    createMultipartUpload: async (key: string, opts?: { httpMetadata?: { contentType?: string } }) => {
      multipart.started++;
      const parts = new Map<number, Uint8Array>();
      return {
        uploadPart: async (n: number, body: Uint8Array) => {
          if (multipart.failPart === n) throw new Error("part failed");
          parts.set(n, new Uint8Array(body));
          return { partNumber: n, etag: String(n) };
        },
        complete: async (list: { partNumber: number }[]) => {
          // As R2: every part but the last must be the same size.
          const sizes = list.map((p) => parts.get(p.partNumber)!.length);
          if (new Set(sizes.slice(0, -1)).size > 1 || (sizes.length > 1 && sizes.at(-1)! > sizes[0]!)) {
            throw new Error(`R2: parts must be the same size except the last (got ${sizes.join(", ")})`);
          }
          stored.set(key, { bytes: join(list.map((p) => parts.get(p.partNumber)!)), type: opts?.httpMetadata?.contentType, parts: list.length });
        },
        abort: async () => void multipart.aborted++,
      };
    },
  } as unknown as R2Bucket;

  const send = (method: "get" | "post" | "put" | "patch" | "delete", path: string, body?: unknown) => {
    const req = request(db.app({ MEDIA_BUCKET: bucket, MEDIA_BASE_URL: MEDIA, ...overrides }))[method](`/api/admin${path}`).set("Authorization", `Bearer ${token}`);
    return body === undefined ? req : req.send(body as object);
  };

  return {
    /** R2 keys deleted so far. */
    deleted,
    /** Files in the fake bucket, and multipart upload counters. */
    stored,
    multipart,
    /** POST /api/admin/uploads with one file. */
    upload: (query: string, bytes: Uint8Array | null, filename = "file.bin", field = "file") => {
      const req = request(db.app({ MEDIA_BUCKET: bucket, MEDIA_BASE_URL: MEDIA, ...overrides }))
        .post(`/api/admin/uploads?${query}`)
        .set("Authorization", `Bearer ${token}`);
      return bytes === null ? req : req.attach(field, Buffer.from(bytes), filename);
    },
    /** POST a raw body to /api/admin/uploads, e.g. a multipart body that is cut off. */
    uploadRaw: (query: string, body: Buffer, contentType: string) =>
      request(db.app({ MEDIA_BUCKET: bucket, MEDIA_BASE_URL: MEDIA, ...overrides }))
        .post(`/api/admin/uploads?${query}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Content-Type", contentType)
        .send(body),
    get: (path: string) => send("get", path),
    post: (path: string, body: unknown) => send("post", path, body),
    put: (path: string, body: unknown) => send("put", path, body),
    patch: (path: string, body: unknown) => send("patch", path, body),
    delete: (path: string) => send("delete", path),
  };
}

// ---------------------------------------------------------------------------
// Request bodies (JSON, as an editor would send them). Text stays "<...>".

export const trackBody = (key = "t", extra: object = {}) => ({ key, display_name: "<...>", is_shown: true, ...extra });

export const projectBody = (slug = "p", extra: object = {}) => ({
  slug,
  name: "<...>",
  type: "stage_play",
  status: "completed",
  start_date: "2025-06-28",
  is_shown: true,
  ...extra,
});

export const memberBody = (extra: object = {}) => ({ name: "<first name surname>", dept_key: "t", position: "<...>", is_shown: true, ...extra });

export const roundBody = (extra: object = {}) => ({
  title: "<...>",
  opens_at: "2030-01-01T00:00:00Z",
  closes_at: "2030-02-01T00:00:00Z",
  positions: [],
  is_shown: true,
  ...extra,
});

export const pageBody = (key = "home", extra: object = {}) => ({ key, title: "<...>", blocks: [], is_shown: true, ...extra });
