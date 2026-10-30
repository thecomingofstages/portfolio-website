import "server-only";
import { connection } from "next/server";
import type { Block, NewProject, PageDoc, PageFields, ProjectDoc, ProjectFields, RoundDoc, TrackDoc } from "@/types/admin";

/**
 * The only way the editor reads and writes data: the server's admin API
 * (docs/API.md "Admin API", docs/EDITOR.md). Runs on the editor's server only,
 * so ADMIN_TOKEN never reaches the browser.
 *
 * - Reads of one page or project return `null` on a 404, so the page can call `notFound()`.
 * - Any other failure throws an `AdminApiError` with the server's message.
 * - With USE_FIXTURES=true, answers come from the in-memory fixture store.
 */

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

const enc = encodeURIComponent;

// --- pages ------------------------------------------------------------------

export function listPages(): Promise<PageDoc[]> {
  return required<PageDoc[]>("GET", "/api/admin/pages");
}

export function getPage(key: string): Promise<PageDoc | null> {
  return call<PageDoc>("GET", `/api/admin/pages/${enc(key)}`);
}

export async function updatePage(key: string, fields: PageFields): Promise<void> {
  await required("PATCH", `/api/admin/pages/${enc(key)}`, fields);
}

export async function savePageBlocks(key: string, blocks: Block[]): Promise<void> {
  await required("PUT", `/api/admin/pages/${enc(key)}/blocks`, blocks);
}

// --- projects -----------------------------------------------------------------

export function listProjects(): Promise<ProjectDoc[]> {
  return required<ProjectDoc[]>("GET", "/api/admin/projects");
}

export function getProject(slug: string): Promise<ProjectDoc | null> {
  return call<ProjectDoc>("GET", `/api/admin/projects/${enc(slug)}`);
}

export async function createProject(fields: NewProject): Promise<void> {
  await required("POST", "/api/admin/projects", fields);
}

/** A changed `slug` renames the project; the server updates its references. */
export async function updateProject(slug: string, fields: ProjectFields): Promise<void> {
  await required("PATCH", `/api/admin/projects/${enc(slug)}`, fields);
}

export async function saveProjectBlocks(slug: string, blocks: Block[]): Promise<void> {
  await required("PUT", `/api/admin/projects/${enc(slug)}/blocks`, blocks);
}

// --- tracks and recruitment rounds ------------------------------------------------
// Each is saved whole (PUT): its lists keep their item ids, and new items get one from the server.

export function listTracks(): Promise<TrackDoc[]> {
  return required<TrackDoc[]>("GET", "/api/admin/tracks");
}

export function getTrack(key: string): Promise<TrackDoc | null> {
  return call<TrackDoc>("GET", `/api/admin/tracks/${enc(key)}`);
}

export function createTrack(track: unknown): Promise<TrackDoc> {
  return required<TrackDoc>("POST", "/api/admin/tracks", track);
}

/** A changed `key` renames the track; the server updates the rounds that point to it. */
export async function saveTrack(key: string, track: unknown): Promise<void> {
  await required("PUT", `/api/admin/tracks/${enc(key)}`, track);
}

export function listRounds(): Promise<RoundDoc[]> {
  return required<RoundDoc[]>("GET", "/api/admin/apply");
}

export function getRound(id: string): Promise<RoundDoc | null> {
  return call<RoundDoc>("GET", `/api/admin/apply/${enc(id)}`);
}

export function createRound(round: unknown): Promise<RoundDoc> {
  return required<RoundDoc>("POST", "/api/admin/apply", round);
}

export async function saveRound(id: string, round: unknown): Promise<void> {
  await required("PUT", `/api/admin/apply/${enc(id)}`, round);
}

// --- uploads -------------------------------------------------------------------

/** Where an uploaded file is filed on the server: under a page's key or a project's slug. */
export type UploadOwner = { collection: "pages" | "projects" | "tracks" | "apply"; owner: string };

/**
 * POST /api/admin/uploads: passes one multipart body (a single `file` field) through to
 * the server as a stream, and answers the file's public `url`. The server checks the type
 * and the size.
 */
export async function uploadFile(
  { collection, owner }: UploadOwner,
  body: ReadableStream<Uint8Array>,
  contentType: string,
): Promise<{ key: string; url: string }> {
  if (process.env.USE_FIXTURES === "true") {
    throw new AdminApiError(501, "Uploads need the real admin API: fixtures cannot store files. Paste an image URL instead.");
  }
  const { base, token } = settings();
  const response = await fetch(`${base}/api/admin/uploads?collection=${collection}&owner=${enc(owner)}`, {
    method: "POST",
    headers: { accept: "application/json", authorization: `Bearer ${token}`, "content-type": contentType },
    body,
    // A streamed request body needs this in Node's fetch.
    duplex: "half",
    cache: "no-store",
  } as RequestInit);
  const answer = settle<{ key: string; url: string }>(response.status, await jsonOf(response));
  if (answer === null) throw new AdminApiError(404, "Not found. Save the project or page first.");
  return answer;
}

/**
 * DELETE /api/admin/uploads/:key for each media URL that a save took out. The server keeps
 * (409) a file any document still uses, so a file shared with another page stays. Cleanup is
 * best effort: the save already worked, so a file that cannot be deleted is left in the bucket.
 */
export async function deleteUnusedMedia(urls: string[]): Promise<void> {
  if (process.env.USE_FIXTURES === "true") return;
  const { mediaKey } = await import("./media");
  for (const url of urls) {
    const key = mediaKey(url);
    if (!key) continue;
    try {
      await call("DELETE", `/api/admin/uploads/${key.split("/").map(enc).join("/")}`);
    } catch (error) {
      if (!(error instanceof AdminApiError)) throw error;
    }
  }
}

// ---------------------------------------------------------------------------

function settings() {
  const base = process.env.API_URL;
  if (!base) throw new Error("API_URL is not set. Set it, or set USE_FIXTURES=true.");
  const token = process.env.ADMIN_TOKEN;
  if (!token) throw new Error("ADMIN_TOKEN is not set.");
  return { base: base.replace(/\/+$/, ""), token };
}

/** The response body, or `null` on a 404. Throws on any other error. */
async function call<T>(method: string, path: string, body?: unknown): Promise<T | null> {
  // Always per request: these are live documents, never prerendered.
  await connection();

  if (process.env.USE_FIXTURES === "true") {
    const { fixtureRequest } = await import("./fixture-store");
    const answer = fixtureRequest(method, path, body === undefined ? undefined : structuredClone(body));
    return settle<T>(answer.status, answer.body);
  }

  const { base, token } = settings();
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  return settle<T>(response.status, await jsonOf(response));
}

async function jsonOf(response: Response): Promise<unknown> {
  const text = await response.text();
  // An empty body (e.g. 204 after a write) is `undefined`, never `null`, which means 404.
  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
}

function settle<T>(status: number, body: unknown): T | null {
  if (status === 404) return null;
  if (status >= 200 && status < 300) return body as T;
  throw new AdminApiError(status, messageFor(status, body));
}

/** Writes and lists never treat a 404 as "nothing": it is an error there. */
async function required<T>(method: string, path: string, body?: unknown): Promise<T> {
  const data = await call<T>(method, path, body);
  if (data === null) throw new AdminApiError(404, "Not found. It may have been renamed or removed.");
  return data;
}

/** The server answers `{ error: string }` (apps/server ErrorHandler). */
function messageFor(status: number, body: unknown): string {
  const error = body && typeof body === "object" && "error" in body ? String((body as { error: unknown }).error) : null;
  if (status === 401) return "The admin token was refused. Check ADMIN_TOKEN.";
  if (status === 409) return error ?? "This conflicts with something that already exists.";
  if (status === 400) return error ?? "The server rejected the data.";
  if (status === 413) return error ?? "The file is too large.";
  return error ? `${error} (${status})` : `The admin API answered ${status}.`;
}
