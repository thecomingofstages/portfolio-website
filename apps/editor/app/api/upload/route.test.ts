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

const postJson = (query: string, body: unknown) =>
  POST(
    new Request(`http://editor.local/api/upload?${query}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://editor.local" },
      body: JSON.stringify(body),
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
    expect((await post("collection=users&owner=x")).status).toBe(400);
    expect((await post("collection=pages&owner=../x")).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers the admin API's error in words", async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 413 }));
    const response = await post("collection=pages&owner=home");
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "The file is too large." });
  });

  it("copies a Google Drive share link into the bucket, through the same upload", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), { headers: { "content-type": "image/jpeg" } }))
      .mockResolvedValueOnce(Response.json({ key: "k", url: "https://media.example/k" }, { status: 201 }));
    const response = await postJson("collection=projects&owner=tcos-2", { url: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing" });
    expect(response.status).toBe(201);
    expect(fetchMock.mock.calls[0][0]).toBe("https://drive.usercontent.google.com/download?id=1AbCdEfGhIjKlMnOp&export=download&confirm=t");
    expect(String((fetchMock.mock.calls[1][1]?.headers as Record<string, string>)["content-type"])).toMatch(/^multipart\/form-data/);
  });

  it("refuses links that are not Drive, and Drive files that are not shared", async () => {
    expect((await postJson("collection=pages&owner=home", { url: "https://example.com/a.jpg" })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(new Response("<html>sign in</html>", { headers: { "content-type": "text/html" } }));
    const response = await postJson("collection=pages&owner=home", { url: "https://drive.google.com/open?id=1AbCdEfGhIjKlMnOp" });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/Anyone with the link/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
