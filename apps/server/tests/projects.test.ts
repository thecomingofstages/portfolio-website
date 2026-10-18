/** S3: GET /api/projects, /api/projects/:slug, /api/projects/:slug/yearbook */
import request from "supertest";
import { describe, expect, it } from "vitest";
import { useTestDb } from "./helpers/db";
import { makeBlock, makeProject, makeTeamMember } from "./helpers/factories";

const db = useTestDb();
const date = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("GET /api/projects", () => {
  it("returns shown projects newest first, as cards with at most one pic", async () => {
    await db.models.projects.insertMany([
      makeProject({ slug: "old", start_date: date("2001-01-01"), pics: ["https://media.test/a.webp", "https://media.test/b.webp"] }),
      makeProject({ slug: "new", start_date: date("2003-01-01") }),
      makeProject({ slug: "hidden", start_date: date("2002-01-01"), is_shown: false }),
    ]);

    const res = await request(db.app()).get("/api/projects");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { slug: "new", name: "<...>", start_date: "2003-01-01T00:00:00.000Z", pics: [] },
      { slug: "old", name: "<...>", start_date: "2001-01-01T00:00:00.000Z", pics: ["https://media.test/a.webp"] },
    ]);
  });

  it("returns [] when there are none", async () => {
    expect((await request(db.app()).get("/api/projects")).body).toEqual([]);
  });
});

describe("GET /api/projects/:slug", () => {
  it("returns the header and shown blocks", async () => {
    await db.models.projects.insertOne(
      makeProject({
        slug: "p",
        venue: "<...>",
        is_yearbook_shown: true,
        blocks: [makeBlock({ id: "a" }), makeBlock({ id: "b", is_shown: false })],
      }),
    );

    const res = await request(db.app()).get("/api/projects/p");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      slug: "p",
      name: "<...>",
      start_date: "2000-01-01T00:00:00.000Z",
      end_date: null,
      venue: "<...>",
      pics: [],
      is_yearbook_shown: true,
    });
    expect(res.body.blocks.map((b: { id: string }) => b.id)).toEqual(["a"]);
  });

  it("does not send team, sponsors or flags in the page body", async () => {
    await db.models.projects.insertOne(makeProject({ slug: "p", team: [makeTeamMember({ name: "<person>" })] }));
    const res = await request(db.app()).get("/api/projects/p");
    expect(res.text).not.toContain("<person>");
    expect(res.text).not.toContain("is_shown");
    expect(res.text).not.toContain("_id");
  });

  it.each([
    ["hidden", "hidden"],
    ["missing", "nope"],
    ["impossible slug", "Bad..Slug"],
  ])("answers 404 for a %s project", async (_label, slug) => {
    await db.models.projects.insertOne(makeProject({ slug: "hidden", is_shown: false }));
    const res = await request(db.app()).get(`/api/projects/${slug}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });
});

describe("GET /api/projects/:slug/yearbook", () => {
  const photo = "https://media.test/projects/p/x.webp";

  it("groups the shown team by department, sorted by dept_name; members keep their order", async () => {
    await db.models.projects.insertOne(
      makeProject({
        slug: "p",
        is_yearbook_shown: true,
        team: [
          makeTeamMember({ name: "<b1>", dept_key: "b", dept_name: "B" }),
          makeTeamMember({ name: "<a1>", dept_key: "a", dept_name: "A", photo, is_photo_allowed: true }),
          makeTeamMember({ name: "<hidden>", dept_key: "a", dept_name: "A", is_shown: false }),
          makeTeamMember({ name: "<b2>", dept_key: "b", dept_name: "B" }),
        ],
      }),
    );

    const res = await request(db.app()).get("/api/projects/p/yearbook");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      slug: "p",
      name: "<...>",
      pics: [],
      departments: [
        { dept_key: "a", dept_name: "A", members: [{ name: "<a1>", nickname: null, position: "<...>", photo }] },
        {
          dept_key: "b",
          dept_name: "B",
          members: [
            { name: "<b1>", nickname: null, position: "<...>", photo: null },
            { name: "<b2>", nickname: null, position: "<...>", photo: null },
          ],
        },
      ],
    });
  });

  it("never sends a photo without consent", async () => {
    await db.models.projects.insertOne(
      makeProject({ slug: "p", is_yearbook_shown: true, team: [makeTeamMember({ photo, is_photo_allowed: false })] }),
    );
    const res = await request(db.app()).get("/api/projects/p/yearbook");
    expect(res.text).not.toContain(photo);
  });

  it.each([
    ["yearbook not shown", { is_yearbook_shown: false }],
    ["yearbook flag missing", {}],
    ["project hidden", { is_yearbook_shown: true, is_shown: false }],
  ])("answers 404 when %s", async (_label, overrides) => {
    await db.models.projects.insertOne(makeProject({ slug: "p", ...overrides }));
    expect((await request(db.app()).get("/api/projects/p/yearbook")).status).toBe(404);
  });
});
