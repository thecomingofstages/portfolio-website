/**
 * Tells the Next.js client which pages changed (task S9, docs/API.md "After a write"):
 *
 *   POST <REVALIDATE_URL>
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   { "paths": ["/", "/projects/<slug>"] }
 *
 * The write has already succeeded when this runs, so a failure here never fails the
 * request: it is logged (paths only, they hold no names), and the page refreshes on its
 * next rebuild instead. A slow client cannot hang the admin API: 5 s timeout.
 */
import { Logger } from "./Logger";

const TIMEOUT_MS = 5000;

export async function revalidate(url: string, secret: string, paths: readonly string[]): Promise<void> {
  const unique = [...new Set(paths)].sort();
  if (unique.length === 0) return;
  if (!/^https?:\/\//.test(url)) {
    // REVALIDATE_URL is still "<...>" (local dev without the client): nothing to call.
    Logger.warn("Revalidate skipped: REVALIDATE_URL is not set", { paths: unique.join(" ") });
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ paths: unique }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) Logger.error("Revalidate failed", null, { status: res.status, paths: unique.join(" ") });
  } catch (err) {
    Logger.error("Revalidate failed", err, { paths: unique.join(" ") });
  }
}
