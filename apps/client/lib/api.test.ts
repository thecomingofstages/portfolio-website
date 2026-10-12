import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HIDDEN_SLUG, NO_YEARBOOK_SLUG, TCOS2_SLUG } from "@/fixtures";

vi.mock("server-only", () => ({}));

const api = await import("./api");

describe("lib/api with fixtures", () => {
  beforeEach(() => vi.stubEnv("USE_FIXTURES", "true"));
  afterEach(() => vi.unstubAllEnvs());

  it("returns every endpoint's fixture", async () => {
    expect((await api.getHomePage())?.key).toBe("home");
    expect((await api.getProjects()).map((p) => p.slug)).toEqual([TCOS2_SLUG, NO_YEARBOOK_SLUG]);
    expect((await api.getProject(TCOS2_SLUG))?.is_yearbook_shown).toBe(true);
    expect((await api.getYearbook(TCOS2_SLUG))?.departments.length).toBeGreaterThan(0);
    expect((await api.getTracks()).length).toBeGreaterThan(0);
    expect((await api.getTrack("it"))?.achievements.length).toBe(1);
    expect((await api.getOpenRounds()).length).toBeGreaterThan(0);
  });

  it("returns null where the server answers 404", async () => {
    expect(await api.getProject(HIDDEN_SLUG)).toBeNull();
    expect(await api.getProject("no-such-project")).toBeNull();
    expect(await api.getProject("constructor")).toBeNull();
    expect(await api.getYearbook(NO_YEARBOOK_SLUG)).toBeNull();
    expect(await api.getYearbook(HIDDEN_SLUG)).toBeNull();
    expect(await api.getTrack("no-such-track")).toBeNull();
  });

  it("never lists the hidden project", async () => {
    const home = await api.getHomePage();
    const everything = JSON.stringify([home, await api.getProjects(), await api.getTracks()]);
    expect(everything).not.toContain(HIDDEN_SLUG);
  });

  it("has an empty and a non-empty set of open rounds", async () => {
    const home = await api.getHomePage();
    const join = home?.blocks.find((block) => block.type === "join");
    expect(join && "rounds" in join ? join.rounds : null).toEqual([]);
    expect((await api.getOpenRounds()).length).toBeGreaterThan(0);
  });

  it("returns a copy, so pages cannot change the fixtures", async () => {
    const first = await api.getProjects();
    first.pop();
    expect((await api.getProjects()).length).toBe(2);
  });
});

describe("lib/api with the real API", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("USE_FIXTURES", "");
    vi.stubEnv("API_URL", "https://api.example/");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("calls API_URL with the encoded path", async () => {
    fetchMock.mockResolvedValue(Response.json({ slug: "a b" }));
    expect(await api.getProject("a b")).toEqual({ slug: "a b" });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example/api/projects/a%20b");
  });

  it("turns a 404 into null", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "not found" }, { status: 404 }));
    expect(await api.getProject("hidden")).toBeNull();
    expect(await api.getHomePage()).toBeNull();
  });

  it("throws on other errors, and on a 404 from a list endpoint", async () => {
    fetchMock.mockResolvedValue(Response.json({ error: "boom" }, { status: 500 }));
    await expect(api.getProject("x")).rejects.toBeInstanceOf(api.ApiError);
    fetchMock.mockResolvedValue(Response.json({ error: "not found" }, { status: 404 }));
    await expect(api.getProjects()).rejects.toMatchObject({ status: 404 });
  });

  it("throws when API_URL is not set", async () => {
    vi.stubEnv("API_URL", "");
    await expect(api.getProjects()).rejects.toThrow("API_URL");
  });
});
