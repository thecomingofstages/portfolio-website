/**
 * Runs before every test file. Tests make no real network calls: `fetch` is replaced.
 * Calls to the test REVALIDATE_URL (http://client.test, see helpers/app.ts) are recorded
 * in `revalidateCalls` and answered 200; any other URL fails the test.
 */
import { beforeEach, vi } from "vitest";

export type RevalidateCall = { url: string; auth: string | null; paths: string[] };
export const revalidateCalls: RevalidateCall[] = [];
/** Set to a status (e.g. 500) or "network" to make the client fail. */
export const revalidateFailure: { mode: number | "network" | null } = { mode: null };

beforeEach(() => {
  revalidateCalls.length = 0;
  revalidateFailure.mode = null;
});

vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  if (!url.startsWith("http://client.test/")) throw new Error(`Unexpected network call in a test: ${url}`);
  if (revalidateFailure.mode === "network") throw new TypeError("fetch failed");
  const headers = new Headers(init?.headers);
  revalidateCalls.push({ url, auth: headers.get("authorization"), paths: JSON.parse(String(init?.body)).paths });
  const status = typeof revalidateFailure.mode === "number" ? revalidateFailure.mode : 200;
  return new Response(JSON.stringify({ revalidated: [] }), { status, headers: { "Content-Type": "application/json" } });
});
