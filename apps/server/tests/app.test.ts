/** App-wide behaviour: security headers, errors, docs switch, config checks. */
import request from "supertest";
import { describe, expect, it } from "vitest";
import { initConfig } from "../src/app/config/init";
import { buildTestApp, testConfig } from "./helpers/app";

describe("security", () => {
  it("sends helmet headers and hides Express", async () => {
    const res = await request(buildTestApp()).get("/api/nothing-here");
    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-security-policy"]).toBeDefined();
  });

  it("sends no CORS headers", async () => {
    const res = await request(buildTestApp()).get("/api/nothing-here").set("Origin", "https://evil.test");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("errors", () => {
  it("answers unknown paths with 404 { error }", async () => {
    const res = await request(buildTestApp()).get("/api/nothing-here");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });

  it("answers broken JSON with 400", async () => {
    const res = await request(buildTestApp())
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send("{bad");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid JSON" });
  });

  it("answers a too-large body with 413", async () => {
    const res = await request(buildTestApp())
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ x: "a".repeat(1_100_000) }));
    expect(res.status).toBe(413);
  });
});

describe("API docs", () => {
  it("are off by default", async () => {
    expect((await request(buildTestApp()).get("/api/docs")).status).toBe(404);
    expect((await request(buildTestApp()).get("/api/openapi.yaml")).status).toBe(404);
  });

  it("serve Swagger UI and the spec when DOCS_ENABLED is true", async () => {
    const app = buildTestApp({ DOCS_ENABLED: "true" });
    const page = await request(app).get("/api/docs");
    expect(page.status).toBe(200);
    expect(page.headers["content-security-policy"]).toContain("default-src 'none'");
    const spec = await request(app).get("/api/openapi.yaml");
    expect(spec.status).toBe(200);
    expect(spec.text).toContain("openapi: 3.1.0");
  });
});

describe("initConfig", () => {
  const { MEDIA_BUCKET, ...env } = testConfig();

  it("accepts a complete environment", () => {
    expect(initConfig({ ...env, MEDIA_BUCKET }).MONGODB_URI).toBe(env.MONGODB_URI);
  });

  it("names what is missing, without values", () => {
    const run = () => initConfig({ ...env, MONGODB_URI: "", JWT_SECRET: "short", MEDIA_BUCKET });
    expect(run).toThrow(/MONGODB_URI/);
    expect(run).toThrow(/JWT_SECRET/);
    expect(run).not.toThrow(/short/);
  });

  it("needs the R2 binding", () => {
    expect(() => initConfig(env)).toThrow(/MEDIA_BUCKET/);
  });
});
