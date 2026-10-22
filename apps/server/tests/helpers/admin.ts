/**
 * Calls to the admin API in tests: a valid token, and a fake R2 bucket that
 * records which files the server deleted.
 */
import { SignJWT } from "jose";
import request from "supertest";
import type { useTestDb } from "./db";
import { testConfig } from "./app";

export const MEDIA = "https://media.test";

export async function adminClient(db: ReturnType<typeof useTestDb>) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("tester")
    .sign(new TextEncoder().encode(testConfig().JWT_SECRET));

  const deleted: string[] = [];
  const bucket = {
    delete: async (keys: string | string[]) => void deleted.push(...[keys].flat()),
  } as unknown as R2Bucket;

  const send = (method: "get" | "post" | "put" | "patch" | "delete", path: string, body?: unknown) => {
    const req = request(db.app({ MEDIA_BUCKET: bucket, MEDIA_BASE_URL: MEDIA }))[method](`/api/admin${path}`).set("Authorization", `Bearer ${token}`);
    return body === undefined ? req : req.send(body as object);
  };

  return {
    /** R2 keys deleted so far. */
    deleted,
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
