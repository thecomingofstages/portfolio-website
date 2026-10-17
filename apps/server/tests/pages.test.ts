/** S3: GET /api/pages/home */
import request from "supertest";
import { describe, expect, it } from "vitest";
import { useTestDb } from "./helpers/db";
import { makeBlock, makePage } from "./helpers/factories";

const db = useTestDb();

describe("GET /api/pages/home", () => {
  it("returns the title and shown blocks in order", async () => {
    await db.models.pages.insertOne(
      makePage({
        blocks: [
          makeBlock({ id: "one" }),
          makeBlock({ id: "hidden", is_shown: false }),
          { id: "two", type: "projects", limit: 3, is_shown: true },
        ],
      }),
    );

    const res = await request(db.app()).get("/api/pages/home");

    expect(res.status).toBe(200);
    expect(res.body.key).toBe("home");
    expect(res.body.title).toBe("<...>");
    expect(res.body.blocks.map((b: { id: string }) => b.id)).toEqual(["one", "two"]);
    // Data blocks keep their pointer; S4 fills in the data.
    expect(res.body.blocks[1]).toEqual({ id: "two", type: "projects", title: null, limit: 3, projects: [] });
  });

  it.each([
    ["hidden", [makePage({ is_shown: false })]],
    ["missing", []],
  ])("answers 404 when Home is %s", async (_label, docs) => {
    if (docs.length) await db.models.pages.insertMany(docs);
    expect((await request(db.app()).get("/api/pages/home")).status).toBe(404);
  });
});
