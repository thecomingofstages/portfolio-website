import { revalidatePath } from "next/cache";

/**
 * Called by the server after a write (docs/API.md "After a write"):
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   { "paths": ["/", "/projects/<slug>"] }
 * Answers 401 without the right secret, 400 for a bad body, and 200 with the
 * paths it refreshed.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!secret || !token || !safeEqual(token, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  const paths = (body as { paths?: unknown } | null)?.paths;
  if (!Array.isArray(paths) || !paths.every((path) => typeof path === "string" && path.startsWith("/"))) {
    return Response.json({ error: "paths must be a list of paths starting with /" }, { status: 400 });
  }

  for (const path of paths) revalidatePath(path);
  return Response.json({ revalidated: paths });
}

/** Compares two strings in time that does not depend on where they differ. */
function safeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < right.length; i++) diff |= (left[i] ?? 0) ^ right[i];
  return diff === 0;
}
