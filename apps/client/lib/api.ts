import "server-only";
import type {
  HomePage,
  OpenRounds,
  ProjectList,
  ProjectPage,
  TrackDetail,
  TrackList,
  Yearbook,
} from "@/types/api";

/**
 * The only way the client reads data: one function per public endpoint
 * (docs/API.md "Public API"). Runs on the Next.js server only.
 *
 * - Functions for things that can be hidden or missing return `null` on a 404,
 *   so the page can call `notFound()`.
 * - Any other failure throws an `ApiError`, which goes to `app/error.tsx`.
 * - With USE_FIXTURES=true, answers come from `fixtures/` instead of API_URL.
 *
 * Fetches use Next.js's defaults: the page is cached, and refreshed through
 * /api/revalidate or the page's own `revalidate`.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    path: string,
  ) {
    super(`API answered ${status} for ${path}`);
    this.name = "ApiError";
  }
}

/** GET /api/pages/home. `null` when the home page is not shown. */
export function getHomePage(): Promise<HomePage | null> {
  return get<HomePage>("/api/pages/home");
}

/** GET /api/projects: shown projects, newest first. */
export function getProjects(): Promise<ProjectList> {
  return getRequired<ProjectList>("/api/projects");
}

/** GET /api/projects/:slug. `null` when there is no such project or it is hidden. */
export function getProject(slug: string): Promise<ProjectPage | null> {
  return get<ProjectPage>(`/api/projects/${encodeURIComponent(slug)}`);
}

/** GET /api/projects/:slug/yearbook. `null` as for getProject, or when the yearbook is not turned on. */
export function getYearbook(slug: string): Promise<Yearbook | null> {
  return get<Yearbook>(`/api/projects/${encodeURIComponent(slug)}/yearbook`);
}

/** GET /api/tracks: shown tracks, by `order`. */
export function getTracks(): Promise<TrackList> {
  return getRequired<TrackList>("/api/tracks");
}

/** GET /api/tracks/:key. `null` when there is no such track or it is hidden. */
export function getTrack(key: string): Promise<TrackDetail | null> {
  return get<TrackDetail>(`/api/tracks/${encodeURIComponent(key)}`);
}

/** GET /api/join: rounds open today, closing soonest first. */
export function getOpenRounds(): Promise<OpenRounds> {
  return getRequired<OpenRounds>("/api/join");
}

// ---------------------------------------------------------------------------

/** Returns the response body, or `null` on a 404. Throws on any other error. */
async function get<T>(path: string): Promise<T | null> {
  if (process.env.USE_FIXTURES === "true") {
    const { fixtureResponse } = await import("@/fixtures");
    const data = fixtureResponse(path);
    return data === undefined ? null : (structuredClone(data) as T);
  }

  const base = process.env.API_URL;
  if (!base) throw new Error("API_URL is not set. Set it, or set USE_FIXTURES=true.");

  const response = await fetch(`${base.replace(/\/+$/, "")}${path}`, {
    headers: { accept: "application/json" },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new ApiError(response.status, path);
  return (await response.json()) as T;
}

/** For endpoints that never answer 404: a 404 there is an error too. */
async function getRequired<T>(path: string): Promise<T> {
  const data = await get<T>(path);
  if (data === null) throw new ApiError(404, path);
  return data;
}
