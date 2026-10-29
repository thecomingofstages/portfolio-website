import { describe, expect, it } from "vitest";
import type { Block } from "@/types/api";
import { type DraftBlock, filledVersion, getPath, NO_IMAGE, readLoad, readProject, setPath, withEmptyLabels } from "./draft";

const draft = (fields: Record<string, unknown>): DraftBlock => ({ id: "b", type: "article", is_shown: true, ...fields }) as DraftBlock;

describe("edit mode paths", () => {
  it("reads and sets nested fields without changing the original", () => {
    const block = draft({ items: [{ desc: "a" }, { desc: "b" }] });
    expect(getPath(block, "items.1.desc")).toBe("b");
    const next = setPath(block, "items.1.desc", "c");
    expect(getPath(next, "items.1.desc")).toBe("c");
    expect(getPath(block, "items.1.desc")).toBe("b");
    expect(Array.isArray(next.items)).toBe(true);
  });
});

describe("empty fields", () => {
  it("fill with their label, and are listed as empty", () => {
    const { block, empty } = withEmptyLabels(draft({ title: null, body: "", image: null }));
    expect(block.title).toBe("Section heading");
    expect(block.image).toBe(NO_IMAGE);
    expect([...empty].sort()).toEqual(["body", "image", "title"]);
  });

  it("leave filled fields alone, and give a new block the lists its component reads", () => {
    const { block, empty } = withEmptyLabels({ id: "g", type: "gallery", is_shown: false, title: "Photos" } as DraftBlock);
    expect(block.title).toBe("Photos");
    expect(block.items).toEqual([]);
    expect(empty.size).toBe(0);
  });

  it("cover every item of a list", () => {
    const { empty } = withEmptyLabels({ id: "v", type: "video", is_shown: true, videos: [{ title: "x" }, {}] } as DraftBlock);
    expect([...empty].sort()).toEqual(["title", "videos.0.caption", "videos.1.caption", "videos.1.title"]);
  });
});

describe("data blocks in edit mode", () => {
  const saved = [{ id: "team", type: "team", title: "Old", project_slug: null, dept_keys: [], departments: [] }] as unknown as Block[];

  it("use the saved, filled version while their settings are unchanged, with the new heading", () => {
    const shown = filledVersion({ id: "team", type: "team", is_shown: true, title: "New", project_slug: null } as DraftBlock, saved);
    expect(shown).toMatchObject({ title: "New", departments: [] });
  });

  it("have none when the settings changed, or the block is new", () => {
    expect(filledVersion({ id: "team", type: "team", is_shown: true, project_slug: "x" } as DraftBlock, saved)).toBeNull();
    expect(filledVersion({ id: "other", type: "team", is_shown: true } as DraftBlock, saved)).toBeNull();
  });
});

describe("editor messages", () => {
  it("accept a load, dropping anything that is not a block", () => {
    const load = readLoad({ tcos: "edit", type: "load", blocks: [{ id: "a", type: "hero" }, null, { id: 3 }], selected: 0 });
    expect(load?.blocks).toHaveLength(1);
    expect(load?.selected).toBe(0);
  });

  it("read a project's header fields, dropping anything that is not text", () => {
    const project = { name: "<...>", start_date: "2026-01-01", end_date: 5, venue: null, pics: ["/a.jpg", 7] };
    expect(readProject({ tcos: "edit", type: "project", project })).toEqual({
      name: "<...>",
      start_date: "2026-01-01",
      end_date: null,
      venue: null,
      pics: ["/a.jpg"],
    });
    expect(readProject({ tcos: "edit", type: "load", blocks: [] })).toBeNull();
  });

  it("ignore other messages", () => {
    expect(readLoad({ type: "load", blocks: [] })).toBeNull();
    expect(readLoad("hello")).toBeNull();
  });
});
