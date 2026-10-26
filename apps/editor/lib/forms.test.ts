import { describe, expect, it } from "vitest";
import { rounds, tracks } from "@/fixtures";
import type { FieldSpec } from "./blocks";
import { formValue, NEW_ROUND_FIELDS, NEW_TRACK_FIELDS, ROUND_FIELDS, TRACK_FIELDS } from "./forms";
import { newRoundSchema, newTrackSchema, roundSchema, trackSchema } from "./schemas";

const keysOf = (specs: readonly FieldSpec[]) => specs.map((s) => s.key);

describe("track and round forms", () => {
  it("only have fields their schemas know", () => {
    const trackKeys = Object.keys(trackSchema.shape);
    const roundKeys = Object.keys(roundSchema.shape);
    for (const key of keysOf(TRACK_FIELDS)) expect(trackKeys).toContain(key);
    for (const key of keysOf(ROUND_FIELDS)) expect(roundKeys).toContain(key);
  });

  it("leave out only the server's fields, keep item ids, and give dates the form's shape", () => {
    const round = formValue({ ...rounds[0], updated_at: "x", extra: 1 }, ROUND_FIELDS);
    expect(round).not.toHaveProperty("_id");
    expect(round).not.toHaveProperty("updated_at");
    expect(round.extra).toBe(1);
    expect(round.opens_at).toBe("2025-04-28");
    const [apply] = round.timeline as Record<string, unknown>[];
    expect(apply).toMatchObject({ _id: "6600000000000000000000e1", start_date: "2025-04-28", end_date: "2025-05-01" });
  });

  it("make a fixture track valid as it is", () => {
    expect(trackSchema.safeParse(formValue(tracks[0], TRACK_FIELDS)).success).toBe(true);
  });

  it("make the fixture round valid once its undecided dates are picked", () => {
    const round = formValue(rounds[0], ROUND_FIELDS);
    expect(roundSchema.safeParse(round).success).toBe(false); // "<...>" dates
    const timeline = (round.timeline as Record<string, unknown>[]).map((e) => ({ ...e, start_date: "2025-05-03T13:00:00+07:00" }));
    expect(roundSchema.safeParse({ ...round, timeline }).success).toBe(true);
  });

  it("create with only the required fields", () => {
    expect(keysOf(NEW_TRACK_FIELDS).sort()).toEqual(["display_name", "key"]);
    expect(keysOf(NEW_ROUND_FIELDS).sort()).toEqual(["closes_at", "opens_at", "title"]);
    expect(newTrackSchema.safeParse({ key: "it", display_name: "IT", is_shown: false }).success).toBe(true);
    expect(newRoundSchema.safeParse({ title: "x", opens_at: "2026-01-01", closes_at: "2026-01-31", positions: [], is_shown: false }).success).toBe(true);
    expect(newTrackSchema.safeParse({ key: "Bad Key", display_name: "IT", is_shown: false }).success).toBe(false);
  });
});
