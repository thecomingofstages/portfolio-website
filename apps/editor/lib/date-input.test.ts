import { describe, expect, it } from "vitest";
import { fromDateParts, normalizeDate, toDateParts } from "./date-input";

describe("date inputs", () => {
  it("shows a date saved without a time as the date only", () => {
    expect(toDateParts("2025-06-28T00:00:00.000Z")).toEqual({ date: "2025-06-28", time: "" });
    expect(fromDateParts({ date: "2025-06-28", time: "" })).toBe("2025-06-28");
  });

  it("shows a time in Bangkok, on the Bangkok day, and keeps it on save", () => {
    // 01:30 in Bangkok is still the day before in UTC.
    expect(toDateParts("2025-06-27T18:30:00.000Z")).toEqual({ date: "2025-06-28", time: "01:30" });
    expect(normalizeDate("2025-06-28T12:00:00.000Z")).toBe("2025-06-28T19:00:00+07:00");
    expect(Date.parse(fromDateParts({ date: "2025-06-28", time: "19:00" }))).toBe(Date.parse("2025-06-28T12:00:00Z"));
  });

  it("leaves a missing or undecided date alone", () => {
    expect(toDateParts("<...>")).toBeNull();
    expect(toDateParts(null)).toBeNull();
    expect(normalizeDate("<...>")).toBe("<...>");
  });
});
