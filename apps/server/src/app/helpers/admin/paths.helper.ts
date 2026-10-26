/**
 * Which site pages a write changes (task S9, docs/API.md "After a write").
 * Each function gets every version of the written document (before and after), so a
 * rename refreshes the old pages as well as the new ones.
 *
 * | Write to      | Paths to refresh                                                                 |
 * | ------------- | -------------------------------------------------------------------------------- |
 * | A project     | /, /projects, /projects/<slug>, /projects/<slug>/yearbook, /join, and           |
 * |               | /tracks/<key> for each track with an achievement on that project                 |
 * | A track       | /, /tracks, /tracks/<key>                                                        |
 * | An apply round| /, /join, and its project page                                                   |
 * | A page        | its path (/ for home)                                                            |
 */
import type { Models } from "../../models";
import type { Doc } from "./crud.helper";

const strings = (docs: readonly (Doc | null | undefined)[], field: string) =>
  [...new Set(docs.flatMap((d) => (typeof d?.[field] === "string" ? [d[field] as string] : [])))];

export async function projectPaths(m: Models, docs: readonly (Doc | null | undefined)[]): Promise<string[]> {
  const slugs = strings(docs, "slug");
  if (slugs.length === 0) return [];
  const trackKeys = await m.tracks.distinct("key", { "achievements.project_slug": { $in: slugs } });
  return [
    "/",
    "/projects",
    "/join",
    ...slugs.flatMap((s) => [`/projects/${s}`, `/projects/${s}/yearbook`]),
    ...trackKeys.map((k) => `/tracks/${k}`),
  ];
}

export async function trackPaths(_m: Models, docs: readonly (Doc | null | undefined)[]): Promise<string[]> {
  const keys = strings(docs, "key");
  return keys.length ? ["/", "/tracks", ...keys.map((k) => `/tracks/${k}`)] : [];
}

export async function applyPaths(_m: Models, docs: readonly (Doc | null | undefined)[]): Promise<string[]> {
  if (!docs.some(Boolean)) return [];
  return ["/", "/join", ...strings(docs, "project_slug").map((s) => `/projects/${s}`)];
}

export async function pagePaths(_m: Models, docs: readonly (Doc | null | undefined)[]): Promise<string[]> {
  return strings(docs, "key").map((k) => (k === "home" ? "/" : `/${k}`));
}
