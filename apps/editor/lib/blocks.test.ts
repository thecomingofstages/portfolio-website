import { describe, expect, it } from "vitest";
import { BLOCK_TYPES } from "./schemas";
import { blockInfo, moveItem, newBlock, nextBlockId, parseStatValue, setField } from "./blocks";

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
});
