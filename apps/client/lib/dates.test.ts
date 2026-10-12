import { describe, expect, it } from "vitest";
import { formatDate } from "./dates";

describe("formatDate", () => {
  it("formats a single date", () => {
    expect(formatDate("2025-06-28")).toBe("2025-06-28");
  });

  it("formats a range", () => {
    expect(formatDate("2025-06-28", "2025-06-29")).toBe("2025-06-28 – 2025-06-29");
  });

  it("shows one date when the range starts and ends on the same day", () => {
    expect(formatDate("2025-06-28", "2025-06-28T12:00:00Z")).toBe("2025-06-28");
  });

  it("shows one date when there is no end date", () => {
    expect(formatDate("2025-06-28", null)).toBe("2025-06-28");
  });

  it("uses Thailand's time zone", () => {
    // 20:00 UTC on 27 June is already 28 June in Bangkok
    expect(formatDate("2025-06-27T20:00:00Z")).toBe("2025-06-28");
  });

  it("returns an empty string for missing or placeholder dates", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate("<...>")).toBe("");
    expect(formatDate("2025-06-28", "<...>")).toBe("2025-06-28");
  });
});
