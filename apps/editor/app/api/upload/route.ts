import { AdminApiError, uploadFile } from "@/lib/admin-api";

/**
 * POST /api/upload?collection=<pages|projects>&owner=<key or slug>: the editor's image
 * upload. The browser sends the file here, and this passes it on to the admin API with
 * the token, which never leaves the editor's server. Answers `{ key, url }` or `{ error }`.
 */
export async function POST(request: Request) {
  // Only the editor's own pages may upload: a form on another site could post here too.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Uploads come from the editor only" }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const collection = params.get("collection");
  const owner = params.get("owner") ?? "";
  if ((collection !== "pages" && collection !== "projects") || !/^[a-z0-9-]{1,100}$/.test(owner)) {
    return Response.json({ error: "Say where the file belongs: a page key or a project slug" }, { status: 400 });
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data") || !request.body) {
    return Response.json({ error: "Send the file as multipart/form-data, in a field named file" }, { status: 400 });
  }

  try {
    return Response.json(await uploadFile({ collection, owner }, request.body, contentType), { status: 201 });
  } catch (error) {
    if (error instanceof AdminApiError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
