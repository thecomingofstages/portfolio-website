import { describe, expect, it } from "vitest";
import { formatDate } from "./dates";

describe("formatDate", () => {
  it("formats a single date in the Thai calendar", () => {
    expect(formatDate("2025-06-28")).toBe("28 มิถุนายน 2568");
  });

  it("formats a range", () => {
    expect(formatDate("2025-04-28", "2025-05-01")).toBe("28 เมษายน 2568 – 1 พฤษภาคม 2568");
  });

  it("shows no time for midnight UTC, the date-only value", () => {
    expect(formatDate("2025-06-28T00:00:00.000Z")).toBe("28 มิถุนายน 2568");
  });

  it("shows the Bangkok time when the date has one", () => {
    // 07:30 UTC is 14:30 in Bangkok
    expect(formatDate("2025-04-28T07:30:00Z")).toBe("28 เมษายน 2568 14:30");
  });

  it("puts each time next to its own date in a range", () => {
    expect(formatDate("2025-04-28T07:30:00Z", "2025-05-01T11:00:00Z")).toBe(
      "28 เมษายน 2568 14:30 – 1 พฤษภาคม 2568 18:00",
    );
    expect(formatDate("2025-04-28", "2025-05-01T11:00:00Z")).toBe(
      "28 เมษายน 2568 – 1 พฤษภาคม 2568 18:00",
    );
  });

  it("shows the day once for a range within one day", () => {
    expect(formatDate("2025-04-28T07:30:00Z", "2025-04-28T11:00:00Z")).toBe(
      "28 เมษายน 2568 14:30 – 18:00",
    );
    expect(formatDate("2025-06-28", "2025-06-28T12:00:00Z")).toBe("28 มิถุนายน 2568");
  });

  it("shows one date when there is no end date", () => {
    expect(formatDate("2025-06-28", null)).toBe("28 มิถุนายน 2568");
  });

  it("uses Thailand's time zone", () => {
    // 20:00 UTC on 27 June is already 03:00 on 28 June in Bangkok
    expect(formatDate("2025-06-27T20:00:00Z")).toBe("28 มิถุนายน 2568 03:00");
  });

  it("returns an empty string for missing or placeholder dates", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate("<...>")).toBe("");
    expect(formatDate("2025-06-28", "<...>")).toBe("28 มิถุนายน 2568");
  });
});
