/**
 * Public project data (task S3): the bookshelf, the project page, the yearbook.
 * Queries filter on is_shown; every result also goes through the visibility filter (S2).
 * `null` means hidden or missing: the controller answers 404.
 */
import type { Models, ProjectDoc } from "../models";
import type { Department } from "../types/public";
import { fillBlocks } from "./blocks.helper";
import { publicTeam } from "./visibility.helper";

/** `pics[0]` as a list of at most one (docs/API.md "Response shapes"). */
export const firstPic = (pics: readonly string[] | null | undefined): string[] => (pics?.[0] ? [pics[0]] : []);

const cardFields = { slug: 1, name: 1, start_date: 1, pics: 1 } as const;

export function toProjectCard(p: Pick<ProjectDoc, "slug" | "name" | "start_date" | "pics">) {
  return { slug: p.slug, name: p.name, start_date: p.start_date, pics: firstPic(p.pics) };
}

/** GET /api/projects: shown projects, newest first by start_date. */
export async function listProjects(m: Models) {
  const docs = await m.projects
    .find({ is_shown: true }, { projection: cardFields })
    .sort({ start_date: -1 })
    .toArray();
  return docs.map(toProjectCard);
}

/** GET /api/projects/:slug: the fixed header and the shown blocks, data blocks filled in (S4). */
export async function getProjectPage(m: Models, slug: string, now: Date = new Date()) {
  // The whole document: its team, sponsors and highlights feed the data blocks.
  const p = await m.projects.findOne({ slug, is_shown: true });
  if (!p) return null;
  return {
    slug: p.slug,
    name: p.name,
    start_date: p.start_date,
    end_date: p.end_date ?? null,
    venue: p.venue ?? null,
    pics: firstPic(p.pics),
    is_yearbook_shown: p.is_yearbook_shown === true,
    blocks: await fillBlocks(m, p.blocks, { kind: "project", project: p }, now),
  };
}

/**
 * A project's shown team grouped into departments (DATABASE.md "Yearbook"):
 * one group per (dept_key, dept_name), sorted by dept_name; members keep their order.
 */
export function groupDepartments(team: ProjectDoc["team"]): Department[] {
  const groups = new Map<string, Department>();
  for (const { dept_key, dept_name, member } of publicTeam(team)) {
    const id = JSON.stringify([dept_key, dept_name]);
    let group = groups.get(id);
    if (!group) groups.set(id, (group = { dept_key, dept_name, members: [] }));
    group.members.push(member);
  }
  // As MongoDB's $sort: null names first, then by name.
  return [...groups.values()].sort((a, b) =>
    a.dept_name === b.dept_name ? 0 : a.dept_name === null ? -1 : b.dept_name === null ? 1 : a.dept_name < b.dept_name ? -1 : 1,
  );
}

/** GET /api/projects/:slug/yearbook: null unless the project and its yearbook are shown. */
export async function getYearbook(m: Models, slug: string) {
  const p = await m.projects.findOne(
    { slug, is_shown: true, is_yearbook_shown: true },
    { projection: { slug: 1, name: 1, pics: 1, team: 1 } },
  );
  if (!p) return null;
  return { slug: p.slug, name: p.name, pics: firstPic(p.pics), departments: groupDepartments(p.team) };
}

/** Names of the shown projects among `slugs`, for achievements and rounds. */
export async function shownProjectNames(m: Models, slugs: readonly string[]): Promise<Map<string, string>> {
  if (slugs.length === 0) return new Map();
  const docs = await m.projects
    .find({ slug: { $in: [...new Set(slugs)] }, is_shown: true }, { projection: { slug: 1, name: 1 } })
    .toArray();
  return new Map(docs.map((d) => [d.slug, d.name]));
}
