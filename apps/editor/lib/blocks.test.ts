import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BLOCK_TYPES } from "./schemas";
import { blockInfo, isPageField, moveItem, newBlock, uuidv7, ON_SITE, PAGE_FIELDS, pageValue, parseStatValue, setField, setPath } from "./blocks";

const fromClient = (path: string) => readFileSync(new URL(`../../client/${path}`, import.meta.url), "utf8");

describe("blocks", () => {
  it("has a label and form fields for every block type", () => {
    for (const type of BLOCK_TYPES) expect(blockInfo[type].label).not.toBe("");
  });

  it("gives new blocks a UUID v7 id, hidden unless asked", () => {
    const block = newBlock("gallery");
    expect(block).toMatchObject({ type: "gallery", is_shown: false, items: [] });
    expect(block.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newBlock("gallery").id).not.toBe(block.id);
    expect(newBlock("gallery", true).is_shown).toBe(true);
    expect(uuidv7(0x0123456789ab).slice(0, 13)).toBe("01234567-89ab");
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

describe("editing on the page", () => {
  const COMPONENTS = { hero: "Hero", article: "Article", image: "ImageBlock", quote: "Quote", gallery: "Gallery", button: "ButtonBlock", video: "Video" } as const;

  it("knows exactly the fields the client marks with data-field", () => {
    for (const [type, file] of Object.entries(COMPONENTS)) {
      const source = fromClient(`components/blocks/${file}.tsx`);
      const marked = new Set<string>();
      for (const [, expr] of source.matchAll(/data-field=(\{[^\n]*\}|"[^"]*")/g)) {
        for (const [, quoted, template] of expr.matchAll(/"([^"]+)"|`([^`]+)`/g)) {
          marked.add((quoted ?? template).replace(/\$\{[^}]+\}/g, "*"));
        }
      }
      const known = PAGE_FIELDS[type as keyof typeof COMPONENTS]!;
      expect([...marked].sort(), type).toEqual([...known.text, ...known.images].sort());
    }
  });

  it("accepts only those fields, by kind", () => {
    expect(isPageField("gallery", "items.3.desc", "text")).toBe(true);
    expect(isPageField("gallery", "items.3.url", "text")).toBe(false);
    expect(isPageField("gallery", "items.3.url", "images")).toBe(true);
    expect(isPageField("hero", "slides.0", "images")).toBe(true);
    expect(isPageField("article", "__proto__", "text")).toBe(false);
    expect(isPageField("team", "title", "text")).toBe(false);
  });

  it("stores emptied text as the form would", () => {
    expect(pageValue("article", "title", "")).toBeNull();
    expect(pageValue("quote", "who", "")).toBe("");
    expect(pageValue("hero", "subtitle", "")).toBeUndefined();
    expect(pageValue("gallery", "items.0.desc", "")).toBeUndefined();
    expect(pageValue("hero", "title", "Hi")).toBe("Hi");
  });

  it("sets nested fields on a copy, and removes a field set to undefined", () => {
    const block = { items: [{ desc: "a" }], subtitle: "s" };
    expect(setPath(block, "items.0.desc", "b")).toEqual({ items: [{ desc: "b" }], subtitle: "s" });
    expect(setPath(block, "subtitle", undefined)).toEqual({ items: [{ desc: "a" }] });
    expect(block.items[0].desc).toBe("a");
  });
});

describe("lib/dates.ts", () => {
  it("is the client's date format, unchanged", () => {
    expect(readFileSync(new URL("./dates.ts", import.meta.url), "utf8")).toBe(fromClient("lib/dates.ts"));
  });
});
