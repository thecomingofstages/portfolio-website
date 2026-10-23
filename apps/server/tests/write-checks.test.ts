/** S7: checks on every write (docs/API.md "Checks on every write"), one block per check. */
import { beforeEach, describe, expect, it } from "vitest";
import { MEDIA, adminClient, memberBody, pageBody, projectBody, roundBody, trackBody } from "./helpers/admin";
import { useTestDb } from "./helpers/db";

const db = useTestDb({ schema: true });
let api: Awaited<ReturnType<typeof adminClient>>;

beforeEach(async () => {
  api = await adminClient(db);
  await api.post("/tracks", trackBody("t"));
  await api.post("/projects", projectBody("p"));
});

const block = (id: string, fields: object = {}) => ({ id, type: "article", body: "<...>", is_shown: true, ...fields });

describe("block ids are unique within a page", () => {
  it.each([
    ["PUT project blocks", () => api.put("/projects/p/blocks", [block("a"), block("a")])],
    ["PUT page blocks", async () => (await api.post("/pages", pageBody()), api.put("/pages/home/blocks", [block("a"), block("a")]))],
    ["POST page", () => api.post("/pages", pageBody("home", { blocks: [block("a"), block("a")] }))],
    ["PATCH project", () => api.patch("/projects/p", { blocks: [block("a"), block("a")] })],
  ])("%s with a repeated id → 400", async (_label, run) => {
    const res = await run();
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('"a"');
  });

  it("the same id on different pages is fine", async () => {
    await api.put("/projects/p/blocks", [block("a")]);
    await api.post("/pages", pageBody());
    expect((await api.put("/pages/home/blocks", [block("a")])).status).toBe(200);
  });
});

describe("references point to things that exist", () => {
  it.each([
    ["team dept_key", () => api.post("/projects/p/team", memberBody({ dept_key: "nope" }))],
    ["team dept_key in a whole-project PUT", () => api.put("/projects/p", projectBody("p", { team: [memberBody({ dept_key: "nope" })] }))],
    ["position dept_key", async () => api.post(`/apply/${(await api.post("/apply", roundBody())).body._id}/positions`, { dept_key: "nope", title: "<...>", is_shown: true })],
    ["round positions dept_key", () => api.post("/apply", roundBody({ positions: [{ dept_key: "nope", title: "<...>", is_shown: true }] }))],
    ["round project_slug", () => api.post("/apply", roundBody({ project_slug: "nope" }))],
    ["achievement project_slug", () => api.post("/tracks/t/achievements", { project_slug: "nope", text: "<...>", is_shown: true })],
    ["data block project_slug", () => api.put("/projects/p/blocks", [{ id: "h", type: "highlights", project_slug: "nope", is_shown: true }])],
    ["team block dept_keys", () => api.put("/projects/p/blocks", [{ id: "t", type: "team", dept_keys: ["nope"], is_shown: true }])],
  ])("%s that does not exist → 400", async (_label, run) => {
    const res = await run();
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('"nope"');
  });

  it("valid references and null project_slug are accepted", async () => {
    expect((await api.post("/projects/p/team", memberBody())).status).toBe(201);
    expect((await api.post("/apply", roundBody({ project_slug: null }))).status).toBe(201);
    expect((await api.put("/projects/p/blocks", [{ id: "h", type: "highlights", project_slug: null, is_shown: true }])).status).toBe(200);
    expect((await api.put("/projects/p/blocks", [{ id: "s", type: "sponsors", project_slug: "p", is_shown: true }])).status).toBe(200);
  });

  it("a hidden project still counts as existing", async () => {
    await api.patch("/projects/p", { is_shown: false });
    expect((await api.post("/tracks/t/achievements", { project_slug: "p", text: "<...>", is_shown: true })).status).toBe(201);
  });
});

describe("deleting something still referenced → 409", () => {
  it.each([
    ["a track achievement", () => api.post("/tracks/t/achievements", { project_slug: "p", text: "<...>", is_shown: true })],
    ["an apply round", () => api.post("/apply", roundBody({ project_slug: "p" }))],
    ["a page block", () => api.post("/pages", pageBody("home", { blocks: [{ id: "j", type: "join", project_slug: "p", is_shown: true }] }))],
  ])("a project referenced by %s", async (_label, refer) => {
    expect((await refer()).status).toBe(201);
    const res = await api.delete("/projects/p");
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/still referenced/);
    expect((await api.get("/projects/p")).status).toBe(200);
  });

  it.each([
    ["a team member", () => api.post("/projects/p/team", memberBody())],
    ["an apply position", () => api.post("/apply", roundBody({ positions: [{ dept_key: "t", title: "<...>", is_shown: true }] }))],
    ["a team block", () => api.put("/projects/p/blocks", [{ id: "team", type: "team", dept_keys: ["t"], is_shown: true }])],
  ])("a track referenced by %s", async (_label, refer) => {
    expect([200, 201]).toContain((await refer()).status);
    expect((await api.delete("/tracks/t")).status).toBe(409);
  });

  it("a project whose own blocks point at it can still be deleted", async () => {
    await api.put("/projects/p/blocks", [{ id: "s", type: "sponsors", project_slug: "p", is_shown: true }]);
    expect((await api.delete("/projects/p")).status).toBe(204);
  });

  it("unreferenced things delete fine", async () => {
    expect((await api.delete("/projects/p")).status).toBe(204);
    expect((await api.delete("/tracks/t")).status).toBe(204);
  });
});

describe("renaming a slug or key updates its references", () => {
  it("project slug: achievements, rounds, project and page blocks follow", async () => {
    await api.post("/projects", projectBody("other"));
    await api.post("/tracks/t/achievements", { project_slug: "p", text: "<...>", is_shown: true });
    const round = (await api.post("/apply", roundBody({ project_slug: "p" }))).body._id;
    await api.put("/projects/p/blocks", [{ id: "self", type: "sponsors", project_slug: "p", is_shown: true }]);
    await api.put("/projects/other/blocks", [{ id: "h", type: "highlights", project_slug: "p", is_shown: true }]);
    await api.post("/pages", pageBody("home", { blocks: [{ id: "j", type: "join", project_slug: "p", is_shown: true }] }));

    const res = await api.patch("/projects/p", { slug: "renamed" });
    expect(res.status).toBe(200);

    expect((await api.get("/projects/p")).status).toBe(404);
    expect((await api.get("/tracks/t/achievements")).body[0].project_slug).toBe("renamed");
    expect((await api.get(`/apply/${round}`)).body.project_slug).toBe("renamed");
    expect((await api.get("/projects/renamed/blocks")).body[0].project_slug).toBe("renamed");
    expect((await api.get("/projects/other/blocks")).body[0].project_slug).toBe("renamed");
    expect((await api.get("/pages/home/blocks")).body[0].project_slug).toBe("renamed");
  });

  it("track key: team, positions and team blocks follow", async () => {
    await api.post("/projects/p/team", memberBody());
    const round = (await api.post("/apply", roundBody({ positions: [{ dept_key: "t", title: "<...>", is_shown: true }] }))).body._id;
    await api.put("/projects/p/blocks", [{ id: "team", type: "team", dept_keys: ["t"], is_shown: true }]);

    expect((await api.patch("/tracks/t", { key: "renamed" })).status).toBe(200);

    expect((await api.get("/projects/p/team")).body[0].dept_key).toBe("renamed");
    expect((await api.get(`/apply/${round}`)).body.positions[0].dept_key).toBe("renamed");
    expect((await api.get("/projects/p/blocks")).body[0].dept_keys).toEqual(["renamed"]);
  });

  it("renaming to a slug that is taken → 409, and nothing changes", async () => {
    await api.post("/projects", projectBody("other"));
    await api.post("/tracks/t/achievements", { project_slug: "p", text: "<...>", is_shown: true });
    expect((await api.patch("/projects/p", { slug: "other" })).status).toBe(409);
    expect((await api.get("/tracks/t/achievements")).body[0].project_slug).toBe("p");
  });
});

describe("withdrawing photo consent removes the photo and deletes the file from R2", () => {
  const photo = `${MEDIA}/projects/p/abc123.webp`;
  let id: string;

  beforeEach(async () => {
    id = (await api.post("/projects/p/team", memberBody({ photo, is_photo_allowed: true }))).body._id;
  });

  it("PATCH is_photo_allowed: false", async () => {
    const res = await api.patch(`/projects/p/team/${id}`, { is_photo_allowed: false });
    expect(res.status).toBe(200);
    expect(res.body.photo).toBeUndefined();
    const stored = await db.models.projects.findOne({ slug: "p" });
    expect(stored?.team?.[0]).not.toHaveProperty("photo");
    expect(api.deleted).toEqual(["projects/p/abc123.webp"]);
  });

  it("a photo without consent is rejected", async () => {
    const res = await api.post("/projects/p/team", memberBody({ photo, is_photo_allowed: false }));
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("photo");
  });

  it("replacing the photo deletes the old file", async () => {
    await api.patch(`/projects/p/team/${id}`, { photo: `${MEDIA}/projects/p/new.webp` });
    expect(api.deleted).toEqual(["projects/p/abc123.webp"]);
  });

  it("removing the person deletes their photo", async () => {
    await api.delete(`/projects/p/team/${id}`);
    expect(api.deleted).toEqual(["projects/p/abc123.webp"]);
  });

  it("a whole-project PUT without the photo deletes it", async () => {
    await api.put("/projects/p", projectBody("p", { team: [memberBody({ _id: id })] }));
    expect(api.deleted).toEqual(["projects/p/abc123.webp"]);
  });

  it("deleting the project deletes its team photos", async () => {
    await api.delete("/projects/p");
    expect(api.deleted).toEqual(["projects/p/abc123.webp"]);
  });

  it("only files in the media bucket are deleted", async () => {
    const other = (await api.post("/projects/p/team", memberBody({ photo: "https://elsewhere.test/x.webp", is_photo_allowed: true }))).body._id;
    await api.patch(`/projects/p/team/${other}`, { is_photo_allowed: false });
    expect(api.deleted).toEqual([]);
  });
});

describe("a photo still in use is never deleted (review on PR #28)", () => {
  const photo = `${MEDIA}/projects/p/abc.webp`;

  it("PUT of the whole project with the same member and photo but no _id keeps the file", async () => {
    await api.post("/projects/p/team", memberBody({ photo, is_photo_allowed: true }));
    const res = await api.put("/projects/p", projectBody("p", { team: [memberBody({ photo, is_photo_allowed: true })] }));
    expect(res.status).toBe(200);
    expect(res.body.team[0].photo).toBe(photo);
    expect(api.deleted).toEqual([]);
  });

  it("two members swapping photos keeps both files", async () => {
    const other = `${MEDIA}/projects/p/def.webp`;
    const a = (await api.post("/projects/p/team", memberBody({ photo, is_photo_allowed: true }))).body;
    const b = (await api.post("/projects/p/team", memberBody({ photo: other, is_photo_allowed: true }))).body;
    await api.patch("/projects/p", {
      team: [
        { ...memberBody({ photo: other, is_photo_allowed: true }), _id: a._id },
        { ...memberBody({ photo, is_photo_allowed: true }), _id: b._id },
      ],
    });
    expect(api.deleted).toEqual([]);
  });

  it.each([
    ["consent withdrawn", (id: string) => api.patch(`/projects/p/team/${id}`, { is_photo_allowed: false })],
    ["member removed", (id: string) => api.delete(`/projects/p/team/${id}`)],
    ["project deleted", () => api.delete("/projects/p")],
  ])("%s: a URL another project still uses is kept", async (_label, act) => {
    const id = (await api.post("/projects/p/team", memberBody({ photo, is_photo_allowed: true }))).body._id;
    await api.post("/projects", projectBody("other"));
    await api.post("/projects/other/team", memberBody({ photo, is_photo_allowed: true }));
    expect([200, 204]).toContain((await act(id)).status);
    expect(api.deleted).toEqual([]);
  });

  it("a URL still used elsewhere on the site (a page block) is kept", async () => {
    const id = (await api.post("/projects/p/team", memberBody({ photo, is_photo_allowed: true }))).body._id;
    await api.post("/pages", pageBody("home", { blocks: [{ id: "img", type: "image", url: photo, is_shown: true }] }));
    await api.delete(`/projects/p/team/${id}`);
    expect(api.deleted).toEqual([]);
  });
});
