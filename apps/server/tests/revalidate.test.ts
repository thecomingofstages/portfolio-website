/** S9: every successful write calls REVALIDATE_URL with the paths from docs/API.md "After a write". */
import { beforeEach, describe, expect, it } from "vitest";
import { adminClient, memberBody, pageBody, projectBody, roundBody, trackBody } from "./helpers/admin";
import { testConfig } from "./helpers/app";
import { useTestDb } from "./helpers/db";
import { revalidateCalls, revalidateFailure } from "./setup";

const db = useTestDb({ schema: true });
let api: Awaited<ReturnType<typeof adminClient>>;

/** The paths of the last call, sorted. */
const last = () => revalidateCalls.at(-1)?.paths ?? [];
const PROJECT = (s: string) => ["/", "/join", "/projects", `/projects/${s}`, `/projects/${s}/yearbook`];

beforeEach(async () => {
  api = await adminClient(db);
  await api.post("/tracks", trackBody("t"));
  await api.post("/projects", projectBody("p"));
  revalidateCalls.length = 0;
});

describe("the call", () => {
  it("POSTs { paths } to REVALIDATE_URL with the secret as a Bearer token", async () => {
    await api.patch("/projects/p", { venue: "<...>" });
    expect(revalidateCalls).toHaveLength(1);
    expect(revalidateCalls[0]).toMatchObject({
      url: testConfig().REVALIDATE_URL,
      auth: `Bearer ${testConfig().REVALIDATE_SECRET}`,
    });
  });

  it("sends each path once, sorted", async () => {
    await api.patch("/projects/p", { venue: "<...>" });
    expect(last()).toEqual([...new Set(last())].sort());
  });
});

describe("paths, as in the API.md table", () => {
  it("a project: /, /projects, its page and yearbook, /join", async () => {
    await api.patch("/projects/p", { venue: "<...>" });
    expect(last()).toEqual(PROJECT("p").sort());
  });

  it("a project: plus /tracks/<key> for each track with an achievement on it", async () => {
    await api.post("/tracks", trackBody("other"));
    await api.post("/tracks/t/achievements", { project_slug: "p", text: "<...>", is_shown: true });
    revalidateCalls.length = 0;
    await api.patch("/projects/p", { name: "<renamed>" });
    expect(last()).toEqual([...PROJECT("p"), "/tracks/t"].sort());
  });

  it("a track: /, /tracks, /tracks/<key>", async () => {
    await api.patch("/tracks/t", { display_name: "<...>" });
    expect(last()).toEqual(["/", "/tracks", "/tracks/t"]);
  });

  it("an apply round: /, /join, and its project page", async () => {
    await api.post("/apply", roundBody({ project_slug: "p" }));
    expect(last()).toEqual(["/", "/join", "/projects/p"]);
  });

  it("an apply round with no project: /, /join", async () => {
    await api.post("/apply", roundBody({ project_slug: null }));
    expect(last()).toEqual(["/", "/join"]);
  });

  it("a page: its path (/ for home)", async () => {
    await api.post("/pages", pageBody("home"));
    expect(last()).toEqual(["/"]);
    await api.post("/pages", pageBody("about"));
    expect(last()).toEqual(["/about"]);
  });
});

describe("every kind of write", () => {
  it.each([
    ["create", () => api.post("/projects", projectBody("q")), PROJECT("q")],
    ["replace", () => api.put("/projects/p", projectBody("p")), PROJECT("p")],
    ["patch", () => api.patch("/projects/p", { venue: "<...>" }), PROJECT("p")],
    ["delete", () => api.delete("/projects/p"), PROJECT("p")],
    ["add a team member", () => api.post("/projects/p/team", memberBody()), PROJECT("p")],
    ["save blocks", () => api.put("/projects/p/blocks", []), PROJECT("p")],
    ["add an achievement", () => api.post("/tracks/t/achievements", { project_slug: "p", text: "<...>", is_shown: true }), ["/", "/tracks", "/tracks/t"]],
  ])("%s", async (_label, write, paths) => {
    expect([200, 201, 204]).toContain((await write()).status);
    expect(last()).toEqual([...paths].sort());
  });

  it("item replace and delete refresh the parent's pages", async () => {
    const id = (await api.post("/projects/p/team", memberBody())).body._id;
    await api.patch(`/projects/p/team/${id}`, { position: "<...>" });
    expect(last()).toEqual(PROJECT("p").sort());
    await api.delete(`/projects/p/team/${id}`);
    expect(last()).toEqual(PROJECT("p").sort());
    expect(revalidateCalls).toHaveLength(3);
  });

  it("a page's blocks: refresh that page", async () => {
    await api.post("/pages", pageBody("home"));
    await api.put("/pages/home/blocks", [{ id: "a", type: "article", body: "<...>", is_shown: true }]);
    expect(last()).toEqual(["/"]);
  });
});

describe("renames refresh the old and the new pages", () => {
  it("project slug", async () => {
    await api.patch("/projects/p", { slug: "renamed" });
    expect(last()).toEqual([...PROJECT("p"), "/projects/renamed", "/projects/renamed/yearbook"].sort());
  });

  it("track key", async () => {
    await api.patch("/tracks/t", { key: "renamed" });
    expect(last()).toEqual(["/", "/tracks", "/tracks/renamed", "/tracks/t"]);
  });

  it("a round moved to another project refreshes both project pages", async () => {
    await api.post("/projects", projectBody("q"));
    const id = (await api.post("/apply", roundBody({ project_slug: "p" }))).body._id;
    await api.patch(`/apply/${id}`, { project_slug: "q" });
    expect(last()).toEqual(["/", "/join", "/projects/p", "/projects/q"]);
  });
});

describe("only successful writes", () => {
  it.each([
    ["a 400", () => api.post("/projects", { slug: "x" })],
    ["a 404", () => api.patch("/projects/nope", { venue: "<...>" })],
    ["a 409", () => api.post("/projects", projectBody("p"))],
    ["a read", () => api.get("/projects/p")],
  ])("%s calls nothing", async (_label, run) => {
    await run();
    expect(revalidateCalls).toHaveLength(0);
  });
});

describe("a failed refresh does not fail the write", () => {
  it.each([
    ["the client answers 500", 500],
    ["the client cannot be reached", "network"],
  ] as const)("%s: the write still succeeds and is saved", async (_label, mode) => {
    revalidateFailure.mode = mode;
    const res = await api.patch("/projects/p", { venue: "<saved anyway>" });
    expect(res.status).toBe(200);
    expect((await db.models.projects.findOne({ slug: "p" }))?.venue).toBe("<saved anyway>");
  });

  it("no REVALIDATE_URL yet (\"<...>\"): nothing is called, the write succeeds", async () => {
    const local = await adminClient(db, { REVALIDATE_URL: "<...>" });
    expect((await local.patch("/projects/p", { venue: "<...>" })).status).toBe(200);
    expect(revalidateCalls).toHaveLength(0);
  });
});
