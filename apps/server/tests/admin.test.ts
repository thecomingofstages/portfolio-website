/**
 * S6: admin CRUD. Runs against a database with the real tcos_schema.mongodb.js
 * validators, so every body the API accepts is also accepted by the database.
 */
import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it } from "vitest";
import { adminClient, memberBody, pageBody, projectBody, roundBody, trackBody } from "./helpers/admin";
import { useTestDb } from "./helpers/db";

const db = useTestDb({ schema: true });
let api: Awaited<ReturnType<typeof adminClient>>;

beforeEach(async () => {
  api = await adminClient(db);
  expect((await api.post("/tracks", trackBody("t"))).status).toBe(201);
});

describe("documents: projects (by slug)", () => {
  it("create, list (hidden too), get, replace, patch, delete", async () => {
    const created = await api.post("/projects", projectBody("p", { is_shown: false }));
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ slug: "p", is_shown: false, start_date: "2025-06-28T00:00:00.000Z" });
    expect(created.body._id).toMatch(/^[0-9a-f]{24}$/);

    expect((await api.get("/projects")).body.map((p: { slug: string }) => p.slug)).toEqual(["p"]);
    expect((await api.get("/projects/p")).body.is_shown).toBe(false);

    const replaced = await api.put("/projects/p", projectBody("p", { name: "<new name>" }));
    expect(replaced.status).toBe(200);
    expect(replaced.body).toMatchObject({ name: "<new name>", is_shown: true });

    const patched = await api.patch("/projects/p", { venue: "<...>" });
    expect(patched.body).toMatchObject({ name: "<new name>", venue: "<...>" });

    expect((await api.delete("/projects/p")).status).toBe(204);
    expect((await api.get("/projects/p")).status).toBe(404);
  });

  it("stores dates as BSON dates", async () => {
    await api.post("/projects", projectBody("p"));
    const stored = await db.models.projects.findOne({ slug: "p" });
    expect(stored?.start_date).toBeInstanceOf(Date);
  });

  it.each([
    ["an unknown field", { phone: "<...>" }, "phone"],
    ["a wrong enum", { type: "concert" }, "type"],
    ["a bad date", { start_date: "28/06/2025" }, "start_date"],
    ["a time without its zone", { start_date: "2025-06-28T19:00" }, "start_date"],
    ["a bad slug", { slug: "Has Spaces" }, "slug"],
  ])("rejects %s with 400 naming the field", async (_label, extra, field) => {
    const res = await api.post("/projects", projectBody("p", extra));
    expect(res.status).toBe(400);
    expect(res.body.error).toContain(field);
  });

  it("rejects a missing required field", async () => {
    const { name, ...body } = projectBody("p");
    expect((await api.post("/projects", body)).status).toBe(400);
  });

  it("answers 409 for a slug that already exists", async () => {
    await api.post("/projects", projectBody("p"));
    expect((await api.post("/projects", projectBody("p"))).status).toBe(409);
  });

  it("answers 404 for a missing project", async () => {
    expect((await api.get("/projects/nope")).status).toBe(404);
    expect((await api.put("/projects/nope", projectBody("nope"))).status).toBe(404);
    expect((await api.delete("/projects/nope")).status).toBe(404);
  });

  it("rejects a non-object body", async () => {
    expect((await api.post("/projects", [1, 2])).status).toBe(400);
  });
});

describe("list items: team, sponsors, highlights (by item _id)", () => {
  beforeEach(async () => {
    await api.post("/projects", projectBody("p"));
  });

  it("team: create gives an _id; get, replace, patch, delete by _id; hidden items are returned", async () => {
    const created = await api.post("/projects/p/team", memberBody({ is_shown: false }));
    expect(created.status).toBe(201);
    const id = created.body._id;
    expect(id).toMatch(/^[0-9a-f]{24}$/);

    expect((await api.get("/projects/p/team")).body).toHaveLength(1);
    expect((await api.get(`/projects/p/team/${id}`)).body.is_shown).toBe(false);
    expect((await api.put(`/projects/p/team/${id}`, memberBody({ nickname: "<...>" }))).body).toMatchObject({ _id: id, nickname: "<...>" });
    expect((await api.patch(`/projects/p/team/${id}`, { position: "<new>" })).body).toMatchObject({ position: "<new>", nickname: "<...>" });
    expect((await api.delete(`/projects/p/team/${id}`)).status).toBe(204);
    expect((await api.get("/projects/p/team")).body).toEqual([]);
  });

  it("does not accept an _id in the body of a new item (the server assigns it)", async () => {
    expect((await api.post("/projects/p/team", memberBody({ _id: new ObjectId().toHexString() }))).status).toBe(400);
  });

  it("answers 404 for a missing item, 400 for a bad id", async () => {
    expect((await api.get(`/projects/p/team/${new ObjectId().toHexString()}`)).status).toBe(404);
    expect((await api.get("/projects/p/team/not-an-id")).status).toBe(400);
  });

  it("sponsors and highlights", async () => {
    const s = await api.post("/projects/p/sponsors", { name: "<...>", tier: "<...>", is_shown: true });
    expect(s.status).toBe(201);
    const h = await api.post("/projects/p/highlights", { event_name: "<...>", date: "2025-06-28", is_shown: true });
    expect(h.status).toBe(201);
    expect((await api.patch(`/projects/p/sponsors/${s.body._id}`, { logo_permission: true })).body.logo_permission).toBe(true);
    expect((await api.delete(`/projects/p/highlights/${h.body._id}`)).status).toBe(204);
  });

  it("a whole-project PUT keeps the given item ids and adds ids to new items", async () => {
    const kept = (await api.post("/projects/p/team", memberBody())).body._id;
    const res = await api.put("/projects/p", projectBody("p", { team: [memberBody({ _id: kept }), memberBody()] }));
    expect(res.status).toBe(200);
    const team = (await api.get("/projects/p/team")).body;
    expect(team[0]._id).toBe(kept);
    expect(team[1]._id).toMatch(/^[0-9a-f]{24}$/);
  });
});

describe("blocks: the whole array in one save", () => {
  it("project blocks: get and put", async () => {
    await api.post("/projects", projectBody("p"));
    const blocks = [
      { id: "story", type: "article", body: "<...>", is_shown: true },
      { id: "hidden", type: "quote", text: "<...>", who: "<...>", is_shown: false },
    ];
    expect((await api.put("/projects/p/blocks", blocks)).body).toEqual(blocks);
    expect((await api.get("/projects/p/blocks")).body).toEqual(blocks);
  });

  it("rejects a block with fields of another type", async () => {
    await api.post("/projects", projectBody("p"));
    const res = await api.put("/projects/p/blocks", [{ id: "x", type: "article", text: "<...>", is_shown: true }]);
    expect(res.status).toBe(400);
  });

  it("pages: put blocks sets updated_at", async () => {
    await api.post("/pages", pageBody());
    await api.put("/pages/home/blocks", [{ id: "projects", type: "projects", limit: 3, is_shown: true }]);
    const page = await db.models.pages.findOne({ key: "home" });
    expect(page?.blocks).toHaveLength(1);
    expect(page?.updated_at).toBeInstanceOf(Date);
  });
});

describe("tracks, apply rounds, pages", () => {
  it("tracks: by key, with achievements", async () => {
    await api.post("/projects", projectBody("p"));
    const a = await api.post("/tracks/t/achievements", { project_slug: "p", year: 2025, text: "<...>", is_shown: true });
    expect(a.status).toBe(201);
    expect((await api.patch("/tracks/t", { order: 2 })).body.order).toBe(2);
    expect((await api.get("/tracks/t/achievements")).body).toHaveLength(1);
  });

  it("apply rounds: by _id, with positions and timeline", async () => {
    const r = await api.post("/apply", roundBody());
    expect(r.status).toBe(201);
    const id = r.body._id;
    expect((await api.post(`/apply/${id}/positions`, { dept_key: "t", title: "<...>", is_shown: true })).status).toBe(201);
    expect((await api.post(`/apply/${id}/timeline`, { start_date: "2030-01-10T10:00:00+07:00", event_name: "<...>", is_shown: true })).status).toBe(201);
    const round = (await api.get(`/apply/${id}`)).body;
    expect(round.positions).toHaveLength(1);
    expect(round.timeline[0].start_date).toBe("2030-01-10T03:00:00.000Z");
    expect((await api.get("/apply/not-an-id")).status).toBe(400);
  });

  it("pages: by key, updated_at set on create", async () => {
    expect((await api.post("/pages", pageBody())).status).toBe(201);
    expect((await api.get("/pages/home")).body.updated_at).toBeTypeOf("string");
    // updated_at is server-managed: a sent value is ignored.
    await api.post("/pages", { ...pageBody("about"), updated_at: "2000-01-01" });
    expect((await api.get("/pages/about")).body.updated_at).not.toMatch(/^2000/);
  });
});

describe("the public API sees admin writes, with its own filtering", () => {
  it("a hidden project is in the admin list but not the public one", async () => {
    await api.post("/projects", projectBody("p", { is_shown: false }));
    expect((await api.get("/projects")).body).toHaveLength(1);
    const { default: request } = await import("supertest");
    expect((await request(db.app()).get("/api/projects")).body).toEqual([]);
  });
});

describe("GET → edit → PUT works as-is (review on PR #28)", () => {
  beforeEach(async () => {
    await api.post("/projects", projectBody("p"));
  });

  it("a whole project, _id included", async () => {
    await api.post("/projects/p/team", memberBody());
    const got = (await api.get("/projects/p")).body;
    const res = await api.put("/projects/p", { ...got, name: "<edited>" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("<edited>");
    expect(res.body._id).toBe(got._id);
  });

  it("a team item, _id included", async () => {
    const item = (await api.post("/projects/p/team", memberBody())).body;
    const res = await api.put(`/projects/p/team/${item._id}`, { ...item, position: "<edited>" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ _id: item._id, position: "<edited>" });
  });

  it("a page, _id and updated_at included", async () => {
    await api.post("/pages", pageBody());
    const got = (await api.get("/pages/home")).body;
    expect((await api.put("/pages/home", { ...got, title: "<edited>" })).status).toBe(200);
  });

  it("PATCH with the matching _id works too", async () => {
    const got = (await api.get("/projects/p")).body;
    expect((await api.patch("/projects/p", { _id: got._id, venue: "<...>" })).status).toBe(200);
  });

  it("another document's or item's _id is refused, naming the right one", async () => {
    const other = (await api.post("/projects", projectBody("other"))).body._id;
    const res = await api.put("/projects/p", { ...projectBody("p"), _id: other });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/^_id: does not match/);

    const a = (await api.post("/projects/p/team", memberBody())).body;
    const b = (await api.post("/projects/p/team", memberBody())).body;
    expect((await api.put(`/projects/p/team/${a._id}`, { ...memberBody(), _id: b._id })).status).toBe(400);
  });

  it("an _id on create is still refused, with a clear message", async () => {
    const res = await api.post("/projects", { ...projectBody("new"), _id: "0123456789abcdef01234567" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/server assigns it/);
  });
});
