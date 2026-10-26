import { beforeEach, describe, expect, it } from "vitest";
import { HIDDEN_SLUG, TCOS2_SLUG } from "@/fixtures";
import type { Block, PageDoc, ProjectDoc, RoundDoc, TrackDoc } from "@/types/admin";
import { fixtureRequest, resetFixtureStore } from "./fixture-store";

const body = <T>(method: string, path: string, data?: unknown) => fixtureRequest(method, path, data).body as T;

describe("fixture store", () => {
  beforeEach(() => resetFixtureStore());

  it("lists hidden projects too", () => {
    const slugs = body<ProjectDoc[]>("GET", "/api/admin/projects").map((p) => p.slug);
    expect(slugs).toContain(HIDDEN_SLUG);
  });

  it("answers 404 for a missing page or project", () => {
    expect(fixtureRequest("GET", "/api/admin/pages/nope").status).toBe(404);
    expect(fixtureRequest("GET", "/api/admin/projects/nope").status).toBe(404);
    expect(fixtureRequest("PUT", "/api/admin/projects/nope/blocks", []).status).toBe(404);
  });

  it("saves a page's blocks whole, and refuses repeated ids", () => {
    const blocks = body<Block[]>("GET", "/api/admin/pages/home/blocks");
    const reordered = [...blocks].reverse();
    expect(fixtureRequest("PUT", "/api/admin/pages/home/blocks", reordered).status).toBe(200);
    expect(body<PageDoc>("GET", "/api/admin/pages/home").blocks.map((b) => b.id)).toEqual(reordered.map((b) => b.id));

    const repeated = fixtureRequest("PUT", "/api/admin/pages/home/blocks", [blocks[0], blocks[0]]);
    expect(repeated.status).toBe(400);
  });

  it("returns copies, so callers cannot change the store", () => {
    const page = body<PageDoc>("GET", "/api/admin/pages/home");
    page.blocks.length = 0;
    expect(body<PageDoc>("GET", "/api/admin/pages/home").blocks.length).toBeGreaterThan(0);
  });

  it("creates a project, and refuses a slug that is taken", () => {
    const fields = { slug: "new-one", name: "<...>", type: "camp", status: "upcoming", start_date: "2026-01-01", is_shown: false };
    expect(fixtureRequest("POST", "/api/admin/projects", fields).status).toBe(201);
    expect(body<ProjectDoc>("GET", "/api/admin/projects/new-one").start_date).toBe("2026-01-01T00:00:00.000Z");
    expect(fixtureRequest("POST", "/api/admin/projects", fields).status).toBe(409);
  });

  it("renames a slug and carries it into block references", () => {
    const blocks = body<Block[]>("GET", "/api/admin/pages/home/blocks");
    const pointer = { id: "tcos2-sponsors", type: "sponsors", is_shown: true, project_slug: TCOS2_SLUG, tiers: [] };
    fixtureRequest("PUT", "/api/admin/pages/home/blocks", [...blocks, pointer]);

    expect(fixtureRequest("PATCH", `/api/admin/projects/${TCOS2_SLUG}`, { slug: "tcos-2" }).status).toBe(200);
    expect(fixtureRequest("GET", `/api/admin/projects/${TCOS2_SLUG}`).status).toBe(404);
    const home = body<PageDoc>("GET", "/api/admin/pages/home");
    expect(home.blocks.find((b) => b.id === "tcos2-sponsors")).toMatchObject({ project_slug: "tcos-2" });
  });

  it("refuses renaming to a slug that is taken", () => {
    expect(fixtureRequest("PATCH", `/api/admin/projects/${TCOS2_SLUG}`, { slug: HIDDEN_SLUG }).status).toBe(409);
  });

  it("changes only the fields it knows", () => {
    fixtureRequest("PATCH", "/api/admin/pages/home", { title: "<...>", is_shown: false, blocks: [] });
    const home = body<PageDoc>("GET", "/api/admin/pages/home");
    expect(home).toMatchObject({ title: "<...>", is_shown: false });
    expect(home.blocks.length).toBeGreaterThan(0);
  });
});

describe("fixture store: tracks and rounds", () => {
  beforeEach(() => resetFixtureStore());

  it("renames a track key into the rounds that point to it, and refuses a taken key", () => {
    const round = body<RoundDoc>("GET", "/api/admin/apply/6600000000000000000000c1");
    round.positions[0].dept_key = "it";
    expect(fixtureRequest("PUT", `/api/admin/apply/${round._id}`, round).status).toBe(200);

    const track = body<TrackDoc>("GET", "/api/admin/tracks/it");
    expect(fixtureRequest("PUT", "/api/admin/tracks/it", { ...track, key: "tech" }).status).toBe(200);
    expect(body<RoundDoc>("GET", `/api/admin/apply/${round._id}`).positions[0].dept_key).toBe("tech");

    expect(fixtureRequest("POST", "/api/admin/tracks", { key: "tech", display_name: "x", is_shown: false }).status).toBe(409);
  });

  it("gives new rounds and new list items an id", () => {
    const created = body<RoundDoc>("POST", "/api/admin/apply", { title: "x", opens_at: "2026-01-01", closes_at: "2026-01-31", positions: [], is_shown: false });
    expect(created._id).toMatch(/^[0-9a-f]{24}$/);
    const saved = body<RoundDoc>("PUT", `/api/admin/apply/${created._id}`, { ...created, positions: [{ dept_key: "it", title: "y", is_shown: false }] });
    expect(saved.positions[0]._id).toMatch(/^[0-9a-f]{24}$/);
    expect(saved.opens_at).toBe("2026-01-01T00:00:00.000Z");
  });
});
