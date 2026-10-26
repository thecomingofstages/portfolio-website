import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));

const { POST } = await import("./route");

const post = (query: string, headers: Record<string, string> = {}) =>
  POST(
    new Request(`http://editor.local/api/upload?${query}`, {
      method: "POST",
      headers: { "content-type": "multipart/form-data; boundary=x", ...headers },
      body: "--x--",
    }),
  );

describe("POST /api/upload", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("USE_FIXTURES", "");
    vi.stubEnv("API_URL", "https://api.example");
    vi.stubEnv("ADMIN_TOKEN", "test-token");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("passes the file on to the admin API, filed under its project", async () => {
    fetchMock.mockResolvedValue(Response.json({ key: "k", url: "https://media.example/k" }, { status: 201 }));
    const response = await post("collection=projects&owner=tcos-2", { origin: "http://editor.local" });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ key: "k", url: "https://media.example/k" });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example/api/admin/uploads?collection=projects&owner=tcos-2");
  });

  it("refuses posts from another site", async () => {
    const response = await post("collection=projects&owner=tcos-2", { origin: "https://elsewhere.example" });
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses an unknown place to file it", async () => {
    expect((await post("collection=apply&owner=x")).status).toBe(400);
    expect((await post("collection=pages&owner=../x")).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers the admin API's error in words", async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 413 }));
    const response = await post("collection=pages&owner=home");
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "The file is too large." });
  });
});
