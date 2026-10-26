import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HIDDEN_SLUG, TCOS2_SLUG } from "@/fixtures";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));

const api = await import("./admin-api");
const { resetFixtureStore } = await import("./fixture-store");

describe("admin API client with fixtures", () => {
  beforeEach(() => {
    vi.stubEnv("USE_FIXTURES", "true");
    resetFixtureStore();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("reads pages and projects, hidden ones too", async () => {
    expect((await api.getPage("home"))?.key).toBe("home");
    expect((await api.getProject(HIDDEN_SLUG))?.is_shown).toBe(false);
    expect((await api.listProjects()).length).toBe(3);
  });

  it("returns null for a missing page or project", async () => {
    expect(await api.getPage("nope")).toBeNull();
    expect(await api.getProject("constructor")).toBeNull();
  });

  it("refuses uploads, which need the real API", async () => {
    await expect(api.uploadFile({ collection: "pages", owner: "home" }, new Response("").body!, "multipart/form-data")).rejects.toMatchObject({ status: 501 });
  });

  it("throws the server's message on a refused write", async () => {
    const blocks = (await api.getPage("home"))!.blocks;
    await expect(api.savePageBlocks("home", [blocks[0], blocks[0]])).rejects.toMatchObject({ status: 400 });
    await expect(api.saveProjectBlocks("nope", [])).rejects.toMatchObject({ status: 404 });
  });
});

describe("admin API client with the real API", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("USE_FIXTURES", "");
    vi.stubEnv("API_URL", "https://api.example/");
    vi.stubEnv("ADMIN_TOKEN", "test-token");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends the token as a Bearer header, from the server only", async () => {
    fetchMock.mockResolvedValue(new Response("[]", { status: 200 }));
    await api.listProjects();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example/api/admin/projects");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-token");
  });

  it("sends writes as JSON", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await api.savePageBlocks("home", []);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example/api/admin/pages/home/blocks");
    expect(init?.method).toBe("PUT");
    expect(init?.body).toBe("[]");
  });

  it("maps 404 to null, and other errors to AdminApiError", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Not found" }), { status: 404 }));
    expect(await api.getProject(TCOS2_SLUG)).toBeNull();

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 }));
    await expect(api.listPages()).rejects.toMatchObject({ status: 401, message: "The admin token was refused. Check ADMIN_TOKEN." });

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Still referenced" }), { status: 409 }));
    await expect(api.saveProjectBlocks(TCOS2_SLUG, [])).rejects.toMatchObject({ status: 409, message: "Still referenced" });
  });

  it("passes an upload through as a stream, with the token, and answers its URL", async () => {
    fetchMock.mockResolvedValue(Response.json({ key: "projects/tcos-2/a.png", url: "https://media.example/projects/tcos-2/a.png" }, { status: 201 }));
    const body = new Response("--x\r\n").body!;
    const answer = await api.uploadFile({ collection: "projects", owner: TCOS2_SLUG }, body, "multipart/form-data; boundary=x");
    expect(answer.url).toBe("https://media.example/projects/tcos-2/a.png");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://api.example/api/admin/uploads?collection=projects&owner=${TCOS2_SLUG}`);
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-token");
    expect(new Headers(init?.headers).get("content-type")).toBe("multipart/form-data; boundary=x");
    expect(init?.body).toBe(body);

    fetchMock.mockResolvedValueOnce(Response.json({ error: "file: images only" }, { status: 400 }));
    await expect(api.uploadFile({ collection: "pages", owner: "home" }, body, "multipart/form-data")).rejects.toMatchObject({
      status: 400,
      message: "file: images only",
    });
  });

  it("refuses to run without a token", async () => {
    vi.stubEnv("ADMIN_TOKEN", "");
    await expect(api.listPages()).rejects.toThrow("ADMIN_TOKEN is not set.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
