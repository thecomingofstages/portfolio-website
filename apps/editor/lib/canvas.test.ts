import { describe, expect, it } from "vitest";
import { canvasMessageSchema, isFromPage } from "./canvas";

describe("messages from the page", () => {
  const page = {} as Window;
  const other = {} as Window;

  it("are accepted only from the framed page's origin and window", () => {
    expect(isFromPage({ origin: "http://site.test", source: page }, "http://site.test", page)).toBe(true);
    expect(isFromPage({ origin: "https://evil.example", source: page }, "http://site.test", page)).toBe(false);
    expect(isFromPage({ origin: "http://site.test", source: other }, "http://site.test", page)).toBe(false);
    expect(isFromPage({ origin: "http://site.test", source: null }, "http://site.test", null)).toBe(false);
  });

  it("are checked for shape", () => {
    expect(canvasMessageSchema.safeParse({ tcos: "edit", type: "move", index: 1, to: 0 }).success).toBe(true);
    expect(canvasMessageSchema.safeParse({ tcos: "edit", type: "move", index: -1, to: 0 }).success).toBe(false);
    expect(canvasMessageSchema.safeParse({ tcos: "edit", type: "delete-everything" }).success).toBe(false);
  });
});
