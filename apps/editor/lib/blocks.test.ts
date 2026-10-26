import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BLOCK_TYPES } from "./schemas";
import { blockInfo, moveItem, newBlock, nextBlockId, ON_SITE, parseStatValue, setField } from "./blocks";

const fromClient = (path: string) => readFileSync(new URL(`../../client/${path}`, import.meta.url), "utf8");

describe("blocks", () => {
  it("has a label and form fields for every block type", () => {
    for (const type of BLOCK_TYPES) expect(blockInfo[type].label).not.toBe("");
  });

  it("gives new blocks a free id, hidden", () => {
    expect(nextBlockId("hero", [])).toBe("hero");
    expect(nextBlockId("hero", ["hero", "hero-2"])).toBe("hero-3");
    const block = newBlock("gallery", ["gallery"]);
    expect(block).toMatchObject({ id: "gallery-2", type: "gallery", is_shown: false, items: [] });
  });

  it("moves items without changing the original", () => {
    const list = ["a", "b", "c"];
    expect(moveItem(list, 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(list, 0, -1)).toEqual(list);
    expect(list).toEqual(["a", "b", "c"]);
  });

  it("removes a field set to undefined", () => {
    expect(setField({ a: 1, b: 2 }, "a", undefined)).toEqual({ b: 2 });
    expect(setField({ a: 1 }, "b", null)).toEqual({ a: 1, b: null });
  });

  it("reads stat values as numbers when they are numbers", () => {
    expect(parseStatValue("306")).toBe(306);
    expect(parseStatValue("4.5")).toBe(4.5);
    expect(parseStatValue("<...>")).toBe("<...>");
    expect(parseStatValue("300+")).toBe("300+");
  });

  it("marks the block types the public site renders, as the client registers them", () => {
    const registry = fromClient("components/blocks/index.ts").split("export const blockComponents")[1];
    const clientTypes = [...registry.matchAll(/^\s+(\w+): \w+,$/gm)].map((m) => m[1]).sort();
    expect(clientTypes.length).toBeGreaterThan(0);
    expect([...ON_SITE].sort()).toEqual(clientTypes);
  });
});

describe("lib/dates.ts", () => {
  it("is the client's date format, unchanged", () => {
    expect(readFileSync(new URL("./dates.ts", import.meta.url), "utf8")).toBe(fromClient("lib/dates.ts"));
  });
});
