import { describe, expect, it } from "vitest";
import { bulleted, linesOf } from "./FieldInput";

describe("linesOf", () => {
  it("drops the bullets and the empty lines", () => {
    expect(linesOf("• one\n•\n  •  two \n\nthree")).toEqual([
      "one",
      "two",
      "three",
    ]);
  });
});

describe("bulleted", () => {
  it("gives each line one bullet back", () => {
    expect(bulleted("• one\ntwo\n•three\n")).toBe("• one\n• two\n• three\n• ");
    expect(bulleted("")).toBe("");
  });
});
