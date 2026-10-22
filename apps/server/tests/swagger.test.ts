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

/** Admin routes (S6): [path, methods]. */
const DOC = ["get", "put", "patch", "delete"];
const LIST = ["get", "post"];
const ADMIN: [string, string[]][] = [
  ...(["/api/admin/projects", "/api/admin/tracks", "/api/admin/apply", "/api/admin/pages"] as const).flatMap((base): [string, string[]][] => {
    const key = base.endsWith("projects") ? "slug" : base.endsWith("apply") ? "id" : "key";
    return [[base, LIST], [`${base}/{${key}}`, DOC]];
  }),
  ...[
    "/api/admin/projects/{slug}/team",
    "/api/admin/projects/{slug}/sponsors",
    "/api/admin/projects/{slug}/highlights",
    "/api/admin/tracks/{key}/achievements",
    "/api/admin/apply/{id}/positions",
    "/api/admin/apply/{id}/timeline",
  ].flatMap((base): [string, string[]][] => [[base, LIST], [`${base}/{itemId}`, DOC]]),
  ["/api/admin/projects/{slug}/blocks", ["get", "put"]],
  ["/api/admin/pages/{key}/blocks", ["get", "put"]],
];

type Param = { name?: string; $ref?: string };
type Op = { responses?: object; parameters?: Param[]; security?: object[] };
type Doc = {
  openapi: string;
  paths: Record<string, Record<string, Op>>;
  components?: { parameters?: Record<string, Param> };
};

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

  it.each(ADMIN)("documents admin %s (%s) with a token requirement", (path, methods) => {
    for (const method of methods) {
      const op = doc.paths[path]?.[method];
      expect(op?.responses, `${method.toUpperCase()} ${path}`).toBeTypeOf("object");
      expect(op?.security, `${method.toUpperCase()} ${path} has no security`).toEqual([{ bearerAuth: [] }]);
    }
  });

  it("declares a parameter for every {placeholder} in a path", () => {
    const resolve = (p: Param) => (p.$ref ? doc.components?.parameters?.[p.$ref.split("/").pop() as string] : p);
    for (const [path, ops] of Object.entries(doc.paths)) {
      const wanted = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      for (const [method, op] of Object.entries(ops)) {
        const names = (op.parameters ?? []).map((p) => resolve(p)?.name);
        for (const w of wanted) expect(names, `${method.toUpperCase()} ${path} lacks {${w}}`).toContain(w);
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
