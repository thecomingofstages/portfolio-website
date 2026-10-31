/** S4: data blocks are filled in on Home and on project pages. */
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApplyDoc, Block } from "../src/app/models";
import { useTestDb } from "./helpers/db";
import { makeHighlight, makePage, makeProject, makeSponsor, makeTeamMember, makeTrack } from "./helpers/factories";

const db = useTestDb();
const NOW = new Date("2030-06-15T12:00:00.000Z");
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000);
const date = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const block = (type: string, fields: Record<string, unknown> = {}): Block => ({ id: type, type, is_shown: true, ...fields });
const round = (o: Partial<ApplyDoc> = {}): ApplyDoc => ({ title: "<...>", opens_at: day(-1), closes_at: day(5), positions: [], is_shown: true, ...o });

/** GET Home with these blocks; returns the filled block by id. */
async function home(blocks: Block[]) {
  await db.models.pages.insertOne(makePage({ blocks }));
  const res = await request(db.app()).get("/api/pages/home");
  expect(res.status).toBe(200);
  return (id: string) => res.body.blocks.find((b: { id: string }) => b.id === id);
}

/** GET a project page with these blocks; returns the filled block by id. */
async function projectPage(slug: string, blocks: Block[]) {
  await db.models.projects.updateOne({ slug }, { $set: { blocks } });
  const res = await request(db.app()).get(`/api/projects/${slug}`);
  expect(res.status).toBe(200);
  return (id: string) => res.body.blocks.find((b: { id: string }) => b.id === id);
}

beforeEach(async () => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  await db.models.projects.insertMany([
    makeProject({
      slug: "new",
      name: "<new>",
      start_date: date("2003-01-01"),
      pics: ["https://media.test/new.webp", "https://media.test/2.webp"],
      is_yearbook_shown: true,
      org_chart_image: "https://media.test/chart.webp",
      team: [
        makeTeamMember({ name: "<new-a>", dept_key: "a", dept_name: "A" }),
        makeTeamMember({ name: "<new-b>", dept_key: "b", dept_name: "B", photo: "https://media.test/p.webp", is_photo_allowed: false }),
      ],
      sponsors: [
        makeSponsor({ name: "<gold>", tier: "gold", logo: "https://media.test/l.webp", logo_permission: false }),
        makeSponsor({ name: "<silver>", tier: "silver" }),
        makeSponsor({ name: "<hidden sponsor>", is_shown: false }),
      ],
      highlights: [makeHighlight({ event_name: "<new-1>" }), makeHighlight({ event_name: "<new-2>" })],
    }),
    makeProject({
      slug: "old",
      name: "<old>",
      start_date: date("2001-01-01"),
      team: [makeTeamMember({ name: "<old-a>", dept_key: "a", dept_name: "A" })],
      sponsors: [makeSponsor({ name: "<old sponsor>", tier: "gold" })],
      highlights: [makeHighlight({ event_name: "<old-1>" })],
    }),
    makeProject({
      slug: "hidden",
      name: "<hidden project>",
      start_date: date("2002-01-01"),
      is_shown: false,
      is_yearbook_shown: true,
      team: [makeTeamMember({ name: "<hidden team>" })],
      sponsors: [makeSponsor({ name: "<hidden project's sponsor>" })],
      highlights: [makeHighlight({ event_name: "<hidden project's highlight>" })],
    }),
  ]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("card lists", () => {
  it("projects: shown projects newest first, up to limit", async () => {
    const get = await home([block("projects", { limit: 1 }), { ...block("projects"), id: "all" }]);
    expect(get("projects").projects).toEqual([{ slug: "new", name: "<new>", start_date: "2003-01-01T00:00:00.000Z", summary: null, cover: "https://media.test/new.webp" }]);
    expect(get("all").projects.map((p: { slug: string }) => p.slug)).toEqual(["new", "old"]);
  });

  it("tracks: shown tracks by order, with at most one pic", async () => {
    await db.models.tracks.insertMany([
      makeTrack({ key: "second", order: 2 }),
      makeTrack({ key: "first", order: 1, pics: ["https://media.test/t1.webp", "https://media.test/t2.webp"] }),
      makeTrack({ key: "hidden", order: 0, is_shown: false }),
    ]);
    const get = await home([block("tracks")]);
    expect(get("tracks").tracks).toEqual([
      { key: "first", display_name: "<...>", desc: null, pics: ["https://media.test/t1.webp"] },
      { key: "second", display_name: "<...>", desc: null, pics: [] },
    ]);
  });

  it("yearbook: shown projects with a yearbook, newest first, up to limit", async () => {
    await db.models.projects.updateOne({ slug: "old" }, { $set: { is_yearbook_shown: true } });
    const get = await home([block("yearbook", { limit: 5 })]);
    expect(get("yearbook").projects).toEqual([
      { slug: "new", name: "<new>", pics: ["https://media.test/new.webp"] },
      { slug: "old", name: "<old>", pics: [] },
    ]);
  });
});

describe("project_slug: null = this project on a project page", () => {
  it("team: grouped departments of this project, org chart when show_org_chart", async () => {
    const get = await projectPage("new", [block("team", { project_slug: null, show_org_chart: true })]);
    expect(get("team").departments).toEqual([
      { dept_key: "a", dept_name: "A", members: [{ name: "<new-a>", nickname: null, position: "<...>", photo: null }] },
      { dept_key: "b", dept_name: "B", members: [{ name: "<new-b>", nickname: null, position: "<...>", photo: null }] },
    ]);
    expect(get("team").org_chart_image).toBe("https://media.test/chart.webp");
  });

  it("team: dept_keys filters departments; no org chart unless show_org_chart", async () => {
    const get = await projectPage("new", [block("team", { dept_keys: ["b"], show_org_chart: false })]);
    expect(get("team").departments.map((d: { dept_key: string }) => d.dept_key)).toEqual(["b"]);
    expect(get("team").org_chart_image).toBeNull();
  });

  it("sponsors: this project's shown sponsors; tiers filters; logo only with permission", async () => {
    const get = await projectPage("new", [block("sponsors"), { ...block("sponsors", { tiers: ["silver"] }), id: "silver" }]);
    expect(get("sponsors").sponsors).toEqual([
      { name: "<gold>", logo: null, tier: "gold" },
      { name: "<silver>", logo: null, tier: "silver" },
    ]);
    expect(get("silver").sponsors.map((s: { name: string }) => s.name)).toEqual(["<silver>"]);
  });

  it("highlights: this project's, up to limit", async () => {
    const get = await projectPage("new", [block("highlights", { limit: 1 })]);
    expect(get("highlights").highlights.map((h: { event_name: string }) => h.event_name)).toEqual(["<new-1>"]);
  });

  it("join: only this project's open rounds", async () => {
    await db.models.apply.insertMany([round({ title: "<new round>", project_slug: "new" }), round({ title: "<other round>", project_slug: "old" })]);
    const get = await projectPage("new", [block("join")]);
    expect(get("join").rounds.map((r: { title: string }) => r.title)).toEqual(["<new round>"]);
  });
});

describe("project_slug: null = all shown projects on Home", () => {
  it("highlights and sponsors across shown projects, newest project first; hidden projects left out", async () => {
    const get = await home([block("highlights"), block("sponsors")]);
    expect(get("highlights").highlights.map((h: { event_name: string }) => h.event_name)).toEqual(["<new-1>", "<new-2>", "<old-1>"]);
    expect(get("sponsors").sponsors.map((s: { name: string }) => s.name)).toEqual(["<gold>", "<silver>", "<old sponsor>"]);
  });

  it("team across shown projects, without an org chart", async () => {
    const get = await home([block("team", { show_org_chart: true })]);
    const names = get("team").departments.flatMap((d: { members: { name: string }[] }) => d.members.map((m) => m.name));
    expect(names.sort()).toEqual(["<new-a>", "<new-b>", "<old-a>"]);
    expect(get("team").org_chart_image).toBeNull();
  });

  it("join: all open rounds, closing soonest first", async () => {
    await db.models.apply.insertMany([
      round({ title: "<later>", closes_at: day(9) }),
      round({ title: "<sooner>", closes_at: day(2) }),
      round({ title: "<closed>", closes_at: day(-1) }),
    ]);
    const get = await home([block("join")]);
    expect(get("join").rounds.map((r: { title: string }) => r.title)).toEqual(["<sooner>", "<later>"]);
  });

  it("nothing from the hidden project appears anywhere on the page", async () => {
    await db.models.pages.insertOne(makePage({ blocks: [block("team"), block("sponsors"), block("highlights"), block("projects"), block("yearbook")] }));
    const res = await request(db.app()).get("/api/pages/home");
    expect(res.text).not.toMatch(/hidden project|hidden team|hidden sponsor/);
  });
});

describe("project_slug: a named project", () => {
  it("reads that project, with its org chart", async () => {
    const get = await home([block("highlights", { project_slug: "old" }), block("team", { project_slug: "new", show_org_chart: true })]);
    expect(get("highlights").highlights.map((h: { event_name: string }) => h.event_name)).toEqual(["<old-1>"]);
    expect(get("team").org_chart_image).toBe("https://media.test/chart.webp");
  });

  it.each(["hidden", "missing"])("a %s project gives empty lists, not an error", async (slug) => {
    await db.models.apply.insertOne(round({ project_slug: "hidden" }));
    const get = await home([
      block("team", { project_slug: slug, show_org_chart: true }),
      block("sponsors", { project_slug: slug }),
      block("highlights", { project_slug: slug }),
      block("join", { project_slug: slug }),
    ]);
    expect(get("team")).toMatchObject({ departments: [], org_chart_image: null });
    expect(get("sponsors").sponsors).toEqual([]);
    expect(get("highlights").highlights).toEqual([]);
    expect(get("join").rounds).toEqual([]);
  });
});

describe("other blocks", () => {
  it("content blocks pass through unchanged, hidden blocks are left out, order is kept", async () => {
    const get = await home([
      block("article", { body: "<...>" }),
      { ...block("article", { body: "<hidden>" }), id: "hidden", is_shown: false },
      block("projects"),
    ]);
    expect(get("article")).toEqual({ id: "article", type: "article", title: null, body: "<...>", image: null, image_side: null });
    expect(get("hidden")).toBeUndefined();
  });

  it("limit: 0 gives an empty list", async () => {
    const get = await home([block("projects", { limit: 0 })]);
    expect(get("projects").projects).toEqual([]);
  });
});
