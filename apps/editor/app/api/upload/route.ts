import { AdminApiError, type UploadOwner, uploadFile } from "@/lib/admin-api";

const COLLECTIONS: readonly string[] = ["pages", "projects", "tracks", "apply"];
const isCollection = (c: string | null): c is UploadOwner["collection"] => c !== null && COLLECTIONS.includes(c);

/**
 * POST /api/upload?collection=<pages|projects|tracks|apply>&owner=<key, slug or id>: the editor's image
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
  if (!isCollection(collection) || !/^[a-z0-9-]{1,100}$/.test(owner)) {
    return Response.json({ error: "Say where the file belongs: a page key, project slug, track key or round id" }, { status: 400 });
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
