import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePath(path) }));

const { POST } = await import("./route");

const SECRET = "test-secret";

function call(body: unknown, authorization?: string) {
  const headers = new Headers({ "content-type": "application/json" });
  if (authorization) headers.set("authorization", authorization);
  return POST(
    new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.stubEnv("REVALIDATE_SECRET", SECRET);
    revalidatePath.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("answers 401 without the secret", async () => {
    const response = await call({ paths: ["/"] });
    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("answers 401 with a wrong secret", async () => {
    const response = await call({ paths: ["/"] }, "Bearer wrong");
    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("answers 401 when no secret is configured", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    const response = await call({ paths: ["/"] }, "Bearer ");
    expect(response.status).toBe(401);
  });

  it("answers 400 for a bad body", async () => {
    expect((await call("not json", `Bearer ${SECRET}`)).status).toBe(400);
    expect((await call({ paths: "/" }, `Bearer ${SECRET}`)).status).toBe(400);
    expect((await call({ paths: ["projects"] }, `Bearer ${SECRET}`)).status).toBe(400);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("refreshes each path with the secret", async () => {
    const paths = ["/", "/projects", "/projects/tcos-2-the-hidden-saloon"];
    const response = await call({ paths }, `Bearer ${SECRET}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revalidated: paths });
    expect(revalidatePath.mock.calls.map(([path]) => path)).toEqual(paths);
  });
});
