/**
 * Filling in data blocks (task S4, docs/API.md "Filling in data blocks").
 *
 * A data block is stored as a pointer (project_slug, limit, dept_keys, tiers ...).
 * Before a page is sent, each one gets its data, so a page is one call and the
 * client components never fetch. Content blocks pass through unchanged.
 *
 * project_slug:
 * - null on a project page = that project;
 * - null on Home = all shown projects (newest first);
 * - a slug = that project, only while it is shown (else the block's list is empty).
 *
 * All data goes through the visibility filter (S2). Data read by several blocks
 * on one page is fetched once per request.
 */
import type { Block, Models, ProjectDoc } from "../models";
import type { PublicBlock } from "../types/public";
import { listOpenRounds } from "./join.helper";
import { firstPic, groupDepartments, listProjects } from "./project.helper";
import { listTracks } from "./track.helper";
import { publicBlocks, publicHighlights, publicSponsors } from "./visibility.helper";

/** Where the blocks are: Home (or another page), or one project's page. */
export type BlockContext = { kind: "page" } | { kind: "project"; project: ProjectDoc };

type Raw = Record<string, unknown>;

/** `limit` from a block: a number caps the list, null or missing means no cap. */
function capped<T>(list: T[], limit: unknown): T[] {
  return typeof limit === "number" ? list.slice(0, Math.max(0, limit)) : list;
}

/** Per-request cache, so blocks that read the same data share one query. */
class Loader {
  private cache = new Map<string, Promise<unknown>>();
  constructor(readonly m: Models, readonly now: Date) {}

  private once<T>(key: string, load: () => Promise<T>): Promise<T> {
    if (!this.cache.has(key)) this.cache.set(key, load());
    return this.cache.get(key) as Promise<T>;
  }

  projectCards = () => this.once("projectCards", () => listProjects(this.m));

  trackCards = () =>
    this.once("trackCards", async () => {
      const [list, pics] = await Promise.all([
        listTracks(this.m),
        this.m.tracks.find({ is_shown: true }, { projection: { key: 1, pics: 1 } }).toArray(),
      ]);
      const picsByKey = new Map(pics.map((t) => [t.key, t.pics]));
      return list.map((t) => ({ ...t, pics: firstPic(picsByKey.get(t.key)) }));
    });

  yearbookCards = () =>
    this.once("yearbookCards", async () => {
      const docs = await this.m.projects
        .find({ is_shown: true, is_yearbook_shown: true }, { projection: { slug: 1, name: 1, pics: 1 } })
        .sort({ start_date: -1 })
        .toArray();
      return docs.map((p) => ({ slug: p.slug, name: p.name, pics: firstPic(p.pics) }));
    });

  /** All shown projects with the fields data blocks read, newest first. */
  shownProjects = () =>
    this.once("shownProjects", () =>
      this.m.projects
        .find({ is_shown: true }, { projection: { slug: 1, org_chart_image: 1, team: 1, sponsors: 1, highlights: 1 } })
        .sort({ start_date: -1 })
        .toArray(),
    );

  /** One shown project by slug, or null. */
  shownProject = (slug: string) =>
    this.once(`project:${slug}`, async () => (await this.shownProjects()).find((p) => p.slug === slug) ?? null);

  openRounds = (projectSlug?: string) =>
    this.once(`rounds:${projectSlug ?? "*"}`, () => listOpenRounds(this.m, this.now, projectSlug));
}

/** The projects a team / sponsors / highlights block reads. */
async function sourceProjects(load: Loader, ctx: BlockContext, projectSlug: unknown): Promise<ProjectDoc[]> {
  if (typeof projectSlug === "string") {
    const p = await load.shownProject(projectSlug);
    return p ? [p] : [];
  }
  return ctx.kind === "project" ? [ctx.project] : load.shownProjects();
}

/** `block` is already in its public shape, so its pointer fields are normalized (null / []). */
async function fillBlock(load: Loader, ctx: BlockContext, block: PublicBlock): Promise<PublicBlock> {
  const fields = block as Raw;
  switch (block.type) {
    case "projects":
      return { ...block, projects: capped(await load.projectCards(), fields.limit) };

    case "tracks":
      return { ...block, tracks: await load.trackCards() };

    case "yearbook":
      return { ...block, projects: capped(await load.yearbookCards(), fields.limit) };

    case "join": {
      const slug = typeof fields.project_slug === "string" ? fields.project_slug : ctx.kind === "project" ? ctx.project.slug : undefined;
      // A named project that is hidden or missing has no rounds to show.
      if (typeof fields.project_slug === "string" && !(await load.shownProject(fields.project_slug))) return { ...block, rounds: [] };
      return { ...block, rounds: await load.openRounds(slug) };
    }

    case "team": {
      const projects = await sourceProjects(load, ctx, fields.project_slug);
      const deptKeys = Array.isArray(fields.dept_keys) ? fields.dept_keys.filter((k): k is string => typeof k === "string") : [];
      const team = projects.flatMap((p) => p.team ?? []).filter((m) => deptKeys.length === 0 || deptKeys.includes(m.dept_key));
      // One org chart only makes sense for one project; Home-wide team blocks get none.
      const single = projects.length === 1 && (typeof fields.project_slug === "string" || ctx.kind === "project") ? projects[0] : undefined;
      return {
        ...block,
        departments: groupDepartments(team),
        org_chart_image: fields.show_org_chart === true ? (single?.org_chart_image ?? null) : null,
      };
    }

    case "sponsors": {
      const projects = await sourceProjects(load, ctx, fields.project_slug);
      const tiers = Array.isArray(fields.tiers) ? fields.tiers.filter((t): t is string => typeof t === "string") : [];
      const sponsors = projects.flatMap((p) => publicSponsors(p.sponsors));
      return { ...block, sponsors: tiers.length ? sponsors.filter((s) => s.tier !== null && tiers.includes(s.tier)) : sponsors };
    }

    case "highlights": {
      const projects = await sourceProjects(load, ctx, fields.project_slug);
      return { ...block, highlights: capped(projects.flatMap((p) => publicHighlights(p.highlights)), fields.limit) };
    }

    default:
      return block; // content blocks
  }
}

/** The shown blocks of a page in their public shape, with every data block filled in. */
export async function fillBlocks(
  m: Models,
  stored: readonly Block[] | null | undefined,
  ctx: BlockContext,
  now: Date = new Date(),
): Promise<PublicBlock[]> {
  const load = new Loader(m, now);
  return Promise.all(publicBlocks(stored).map((b) => fillBlock(load, ctx, b)));
}
