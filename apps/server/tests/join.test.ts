/** S3: GET /api/join, open rounds closing soonest first. */
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApplyDoc } from "../src/app/models";
import { useTestDb } from "./helpers/db";
import { makePosition, makeProject, makeTimelineEvent } from "./helpers/factories";

const db = useTestDb();
const NOW = new Date("2030-06-15T12:00:00.000Z");
const day = (offset: number) => new Date(NOW.getTime() + offset * 86_400_000);

function makeRound(overrides: Partial<ApplyDoc> = {}): ApplyDoc {
  return { title: "<...>", opens_at: day(-10), closes_at: day(10), positions: [], is_shown: true, ...overrides };
}

describe("GET /api/join", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const titles = async () => (await request(db.app()).get("/api/join")).body.map((r: { title: string }) => r.title);

  it("returns only rounds open now", async () => {
    await db.models.apply.insertMany([
      makeRound({ title: "open" }),
      makeRound({ title: "not yet", opens_at: day(1) }),
      makeRound({ title: "closed", closes_at: day(-1) }),
      makeRound({ title: "extended", closes_at: day(-1), extended_to: day(2) }),
      makeRound({ title: "hidden", is_shown: false }),
    ]);
    expect((await titles()).sort()).toEqual(["extended", "open"]);
  });

  it("sorts by the real closing date: extended_to when set, else closes_at", async () => {
    await db.models.apply.insertMany([
      makeRound({ title: "closes in 5", closes_at: day(5) }),
      makeRound({ title: "extended to 3", closes_at: day(-1), extended_to: day(3) }),
      makeRound({ title: "closes in 1, extended to 9", closes_at: day(1), extended_to: day(9) }),
    ]);
    expect(await titles()).toEqual(["extended to 3", "closes in 5", "closes in 1, extended to 9"]);
  });

  it("sends the documented shape with shown positions and timeline only", async () => {
    await db.models.projects.insertOne(makeProject({ slug: "p", name: "<project>" }));
    await db.models.apply.insertOne(
      makeRound({
        project_slug: "p",
        positions: [makePosition({ title: "<kept>" }), makePosition({ title: "<hidden>", is_shown: false })],
        timeline: [makeTimelineEvent({ event_name: "<kept>" }), makeTimelineEvent({ event_name: "<hidden>", is_shown: false })],
      }),
    );

    const [round] = (await request(db.app()).get("/api/join")).body;

    expect(Object.keys(round).sort()).toEqual(
      ["apply_url", "closes_at", "extended_to", "opens_at", "positions", "poster", "project_name", "qualifications", "timeline", "title"].sort(),
    );
    expect(round).toMatchObject({ project_name: "<project>", poster: null, extended_to: null, qualifications: null, apply_url: null });
    expect(round.positions.map((p: { title: string }) => p.title)).toEqual(["<kept>"]);
    expect(round.timeline.map((t: { event_name: string }) => t.event_name)).toEqual(["<kept>"]);
    expect(JSON.stringify(round)).not.toMatch(/_id|is_shown/);
  });

  it("sends project_name null for a round with no project or a hidden project", async () => {
    await db.models.projects.insertOne(makeProject({ slug: "hidden", name: "<hidden project>", is_shown: false }));
    await db.models.apply.insertMany([makeRound({ project_slug: null }), makeRound({ project_slug: "hidden" })]);
    const res = await request(db.app()).get("/api/join");
    expect(res.body.map((r: { project_name: unknown }) => r.project_name)).toEqual([null, null]);
    expect(res.text).not.toContain("<hidden project>");
  });

  it("returns [] when no round is open", async () => {
    expect((await request(db.app()).get("/api/join")).body).toEqual([]);
  });
});
