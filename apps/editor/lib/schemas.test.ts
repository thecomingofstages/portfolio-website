import { describe, expect, it } from "vitest";
import { homePage, projects } from "@/fixtures";
import { BLOCK_TYPES, blocksSchema, describeIssues, newProjectSchema, projectFieldsSchema } from "./schemas";
import { newBlock } from "./blocks";

describe("block schemas", () => {
  it("accept every fixture page's blocks", () => {
    expect(blocksSchema.safeParse(homePage.blocks).success).toBe(true);
    for (const p of projects) expect(blocksSchema.safeParse(p.blocks).success).toBe(true);
  });

  it("accept a new block of every type", () => {
    const blocks = BLOCK_TYPES.map((type, i) => newBlock(type, [`taken-${i}`]));
    expect(blocksSchema.safeParse(blocks).success).toBe(true);
  });

  it("reject repeated ids, naming the block", () => {
    const result = blocksSchema.safeParse([newBlock("article", []), newBlock("article", [])]);
    expect(result.success).toBe(false);
    if (!result.success) expect(describeIssues(result.error, [{ type: "article" }, { type: "article" }])).toEqual([
      'Block 2 (article) › id: id "article" is used twice',
    ]);
  });

  it("reject fields the schema does not list, and missing required ones", () => {
    const extra = { ...newBlock("quote", []), color: "x" };
    expect(blocksSchema.safeParse([extra]).success).toBe(false);
    const noBody: Record<string, unknown> = { ...newBlock("article", []) };
    delete noBody.body;
    expect(blocksSchema.safeParse([noBody]).success).toBe(false);
  });

  it("reject public-only data keys sent back by mistake", () => {
    const filled = { ...newBlock("projects", []), projects: [] };
    expect(blocksSchema.safeParse([filled]).success).toBe(false);
  });

  it("reject an empty id or one with spaces", () => {
    expect(blocksSchema.safeParse([{ ...newBlock("tracks", []), id: "" }]).success).toBe(false);
    expect(blocksSchema.safeParse([{ ...newBlock("tracks", []), id: "our partners" }]).success).toBe(false);
  });
});

describe("project schemas", () => {
  const valid = {
    slug: "a-project",
    name: "<...>",
    type: "stage_play",
    status: "completed",
    start_date: "2025-06-28",
    end_date: null,
    venue: null,
    summary: "",
    pics: [],
    org_chart_image: null,
    is_yearbook_shown: false,
    is_shown: false,
  };

  it("accept valid fields", () => {
    expect(projectFieldsSchema.safeParse(valid).success).toBe(true);
  });

  it("reject placeholder dates and enums, and bad slugs", () => {
    expect(projectFieldsSchema.safeParse({ ...valid, start_date: "<...>" }).success).toBe(false);
    expect(projectFieldsSchema.safeParse({ ...valid, type: "<...>" }).success).toBe(false);
    expect(projectFieldsSchema.safeParse({ ...valid, slug: "Has Spaces" }).success).toBe(false);
    expect(projectFieldsSchema.safeParse({ ...valid, slug: "double--hyphen" }).success).toBe(false);
  });

  it("need only the required fields for a new project", () => {
    const { slug, name, type, status, start_date, is_shown } = valid;
    expect(newProjectSchema.safeParse({ slug, name, type, status, start_date, is_shown }).success).toBe(true);
    expect(newProjectSchema.safeParse({ slug, name, type, status, is_shown }).success).toBe(false);
  });
});
