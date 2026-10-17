/** S3: GET /api/tracks, /api/tracks/:key */
import request from "supertest";
import { describe, expect, it } from "vitest";
import { useTestDb } from "./helpers/db";
import { makeAchievement, makeProject, makeTrack } from "./helpers/factories";

const db = useTestDb();

describe("GET /api/tracks", () => {
  it("returns shown tracks by order", async () => {
    await db.models.tracks.insertMany([
      makeTrack({ key: "second", order: 2, desc: "<...>" }),
      makeTrack({ key: "first", order: 1 }),
      makeTrack({ key: "hidden", order: 0, is_shown: false }),
    ]);

    const res = await request(db.app()).get("/api/tracks");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { key: "first", display_name: "<...>", desc: null },
      { key: "second", display_name: "<...>", desc: "<...>" },
    ]);
  });
});

describe("GET /api/tracks/:key", () => {
  it("names each achievement's project, and leaves out hidden achievements and hidden projects", async () => {
    await db.models.projects.insertMany([
      makeProject({ slug: "shown-project", name: "<shown project>" }),
      makeProject({ slug: "hidden-project", name: "<hidden project>", is_shown: false }),
    ]);
    await db.models.tracks.insertOne(
      makeTrack({
        key: "t",
        pics: ["https://media.test/1.webp", "https://media.test/2.webp"],
        achievements: [
          makeAchievement({ project_slug: "shown-project", text: "<kept>", year: 2000 }),
          makeAchievement({ project_slug: "hidden-project", text: "<hidden project's>" }),
          makeAchievement({ project_slug: "missing-project", text: "<missing project's>" }),
          makeAchievement({ project_slug: "shown-project", text: "<hidden achievement>", is_shown: false }),
        ],
      }),
    );

    const res = await request(db.app()).get("/api/tracks/t");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      key: "t",
      display_name: "<...>",
      desc: null,
      pics: ["https://media.test/1.webp", "https://media.test/2.webp"],
      achievements: [{ year: 2000, text: "<kept>", pics: [], project_name: "<shown project>" }],
    });
    expect(res.text).not.toContain("<hidden project>");
  });

  it.each([
    ["hidden", "hidden"],
    ["missing", "nope"],
    ["impossible key", "NOT A KEY"],
  ])("answers 404 for a %s track", async (_label, key) => {
    await db.models.tracks.insertOne(makeTrack({ key: "hidden", is_shown: false }));
    expect((await request(db.app()).get(`/api/tracks/${encodeURIComponent(key)}`)).status).toBe(404);
  });
});
