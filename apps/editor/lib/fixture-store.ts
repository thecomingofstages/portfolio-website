import * as seed from "@/fixtures";
import type { Block, PageDoc, ProjectDoc } from "@/types/admin";

/**
 * The admin API in memory, for USE_FIXTURES=true (docs/EDITOR.md "Developing
 * before the admin API exists"). It answers the paths lib/admin-api.ts calls,
 * with the server's checks the editor relies on: 404 for a missing page or
 * project, 400 for repeated block ids, 409 for a slug that is taken, and slug
 * renames carried into `project_slug` references in blocks.
 *
 * Dev only. Saves last until the dev server restarts.
 */

export type FixtureAnswer = { status: number; body: unknown };

type Store = { pages: PageDoc[]; projects: ProjectDoc[] };

const KEY = Symbol.for("tcos-editor.fixture-store");
type WithStore = typeof globalThis & { [KEY]?: Store };

function fresh(): Store {
  return { pages: structuredClone([seed.homePage]), projects: structuredClone(seed.projects) };
}

/** One store per server process, kept on globalThis so it survives hot reloads. */
function store(): Store {
  const g = globalThis as WithStore;
  return (g[KEY] ??= fresh());
}

/** For tests: start again from the fixtures. */
export function resetFixtureStore() {
  (globalThis as WithStore)[KEY] = fresh();
}

const ok = (body: unknown, status = 200): FixtureAnswer => ({ status, body: structuredClone(body) });
const fail = (status: number, error: string): FixtureAnswer => ({ status, body: { error } });

const PAGE_FIELDS = ["title", "is_shown"] as const;
const PROJECT_FIELDS = [
  "slug",
  "name",
  "type",
  "status",
  "start_date",
  "end_date",
  "venue",
  "summary",
  "pics",
  "org_chart_image",
  "is_yearbook_shown",
  "is_shown",
] as const;

function repeatedBlockId(blocks: unknown): string | null {
  if (!Array.isArray(blocks)) return "blocks must be a list";
  const seen = new Set<unknown>();
  for (const b of blocks as Block[]) {
    if (seen.has(b?.id)) return `Block id "${String(b?.id)}" is used twice`;
    seen.add(b?.id);
  }
  return null;
}

/** Stored dates are Dates; the API sends them as ISO strings in UTC, as the server does. */
function toIsoDate(value: unknown): unknown {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value))
    ? new Date(value).toISOString()
    : value;
}

function pick<K extends string>(body: unknown, keys: readonly K[]): Partial<Record<K, unknown>> {
  const out: Partial<Record<K, unknown>> = {};
  if (body && typeof body === "object") {
    for (const k of keys) if (Object.hasOwn(body, k)) out[k] = (body as Record<string, unknown>)[k];
  }
  for (const k of ["start_date", "end_date"] as const) {
    if (Object.hasOwn(out, k)) (out as Record<string, unknown>)[k] = toIsoDate((out as Record<string, unknown>)[k]);
  }
  return out;
}

/** A renamed slug follows into every block that points at it. */
function renameSlugReferences(s: Store, from: string, to: string) {
  const blockLists = [...s.pages.map((p) => p.blocks), ...s.projects.map((p) => p.blocks ?? [])];
  for (const blocks of blockLists) {
    for (const b of blocks) {
      if ("project_slug" in b && b.project_slug === from) b.project_slug = to;
    }
  }
}

export function fixtureRequest(method: string, path: string, body?: unknown): FixtureAnswer {
  const s = store();
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] !== "api" || parts[1] !== "admin") return fail(404, "Not found");
  const [, , resource, id, sub, ...rest] = parts;
  if (rest.length) return fail(404, "Not found");

  if (resource === "pages") {
    if (!id) return method === "GET" ? ok(s.pages) : fail(405, "Method not allowed");
    const page = s.pages.find((p) => p.key === id);
    if (!page) return fail(404, "Page not found");
    if (!sub) {
      if (method === "GET") return ok(page);
      if (method === "PATCH") {
        Object.assign(page, pick(body, PAGE_FIELDS), { updated_at: new Date().toISOString() });
        return ok(page);
      }
    }
    if (sub === "blocks") {
      if (method === "GET") return ok(page.blocks);
      if (method === "PUT") {
        const problem = repeatedBlockId(body);
        if (problem) return fail(400, problem);
        page.blocks = structuredClone(body as Block[]);
        page.updated_at = new Date().toISOString();
        return ok(page.blocks);
      }
    }
    return fail(405, "Method not allowed");
  }

  if (resource === "projects") {
    if (!id) {
      if (method === "GET") return ok(s.projects);
      if (method === "POST") {
        const fields = pick(body, PROJECT_FIELDS);
        if (typeof fields.slug !== "string") return fail(400, "slug: Required");
        if (s.projects.some((p) => p.slug === fields.slug)) return fail(409, `The slug "${fields.slug}" is taken`);
        const project = { pics: [], blocks: [], is_yearbook_shown: false, ...fields } as ProjectDoc;
        s.projects.push(project);
        return ok(project, 201);
      }
      return fail(405, "Method not allowed");
    }
    const project = s.projects.find((p) => p.slug === id);
    if (!project) return fail(404, "Project not found");
    if (!sub) {
      if (method === "GET") return ok(project);
      if (method === "PATCH") {
        const fields = pick(body, PROJECT_FIELDS);
        if (typeof fields.slug === "string" && fields.slug !== project.slug) {
          if (s.projects.some((p) => p.slug === fields.slug)) return fail(409, `The slug "${fields.slug}" is taken`);
          renameSlugReferences(s, project.slug, fields.slug);
        }
        Object.assign(project, fields);
        return ok(project);
      }
    }
    if (sub === "blocks") {
      if (method === "GET") return ok(project.blocks ?? []);
      if (method === "PUT") {
        const problem = repeatedBlockId(body);
        if (problem) return fail(400, problem);
        project.blocks = structuredClone(body as Block[]);
        return ok(project.blocks);
      }
    }
    return fail(405, "Method not allowed");
  }

  return fail(404, "Not found");
}
