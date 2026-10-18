/**
 * swagger.yaml is written by hand: check it parses and stays complete,
 * so /api/docs never shows a parse error (review on PR #15).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const text = readFileSync(new URL("../swagger.yaml", import.meta.url), "utf8");

/** Every endpoint the server answers, as OpenAPI paths. Add new routes here. */
const IMPLEMENTED = [
  "/api/health",
  "/api/pages/home",
  "/api/projects",
  "/api/projects/{slug}",
  "/api/projects/{slug}/yearbook",
  "/api/tracks",
  "/api/tracks/{key}",
  "/api/join",
];

type Doc = { openapi: string; paths: Record<string, Record<string, { responses?: object }>> };

describe("swagger.yaml", () => {
  it("parses as YAML, without errors or warnings", () => {
    expect(() => parse(text, { prettyErrors: true, strict: true })).not.toThrow();
  });

  // Parsed lazily, so a broken file fails the test above with its line number, not the whole file.
  const doc = (() => {
    try {
      return parse(text) as Doc;
    } catch {
      return { openapi: "", paths: {} } as Doc;
    }
  })();

  it("is OpenAPI 3.1", () => {
    expect(doc.openapi).toBe("3.1.0");
  });

  it.each(IMPLEMENTED)("documents GET %s with its responses", (path) => {
    expect(doc.paths[path]?.get?.responses).toBeTypeOf("object");
  });

  it("has every operation's keys at the right level (no indentation slips)", () => {
    const allowed = new Set(["tags", "summary", "description", "parameters", "responses", "security", "requestBody"]);
    for (const [path, ops] of Object.entries(doc.paths)) {
      for (const [method, op] of Object.entries(ops)) {
        for (const key of Object.keys(op)) expect(allowed, `${method.toUpperCase()} ${path}: unexpected "${key}"`).toContain(key);
        expect(op.responses, `${method.toUpperCase()} ${path} has no responses`).toBeTypeOf("object");
      }
    }
  });

  it("resolves every $ref", () => {
    const refs = [...text.matchAll(/\$ref: "#\/([^"]+)"/g)].map((m) => m[1] as string);
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      const target = ref.split("/").reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], doc);
      expect(target, `#/${ref} does not exist`).toBeDefined();
    }
  });
});
