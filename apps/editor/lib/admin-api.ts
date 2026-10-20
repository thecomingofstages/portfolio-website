import "server-only";
import { connection } from "next/server";
import type { Block, NewProject, PageDoc, PageFields, ProjectDoc, ProjectFields } from "@/types/admin";

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

// ---------------------------------------------------------------------------

/** The response body, or `null` on a 404. Throws on any other error. */
async function call<T>(method: string, path: string, body?: unknown): Promise<T | null> {
  // Always per request: these are live documents, never prerendered.
  await connection();

  if (process.env.USE_FIXTURES === "true") {
    const { fixtureRequest } = await import("./fixture-store");
    const answer = fixtureRequest(method, path, body === undefined ? undefined : structuredClone(body));
    return settle<T>(answer.status, answer.body);
  }

  const base = process.env.API_URL;
  if (!base) throw new Error("API_URL is not set. Set it, or set USE_FIXTURES=true.");
  const token = process.env.ADMIN_TOKEN;
  if (!token) throw new Error("ADMIN_TOKEN is not set.");

  const response = await fetch(`${base.replace(/\/+$/, "")}${path}`, {
    method,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  // An empty body (e.g. 204 after a write) is `undefined`, never `null`, which means 404.
  let parsed: unknown = undefined;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = undefined;
  }
  return settle<T>(response.status, parsed);
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
  return error ? `${error} (${status})` : `The admin API answered ${status}.`;
}
