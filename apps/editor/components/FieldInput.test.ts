import { describe, expect, it } from "vitest";
import { linesOf } from "./FieldInput";

describe("linesOf", () => {
  it("drops the bullets and the empty lines", () => {
    expect(linesOf("• one\n•\n  •  two \n\nthree")).toEqual(["one", "two", "three"]);
  });
});
