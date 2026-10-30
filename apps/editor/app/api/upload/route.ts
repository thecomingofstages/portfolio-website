import { AdminApiError, type UploadOwner, uploadFile } from "@/lib/admin-api";
import { driveFileId } from "@/lib/media";

const COLLECTIONS: readonly string[] = ["pages", "projects", "tracks", "apply"];
const isCollection = (c: string | null): c is UploadOwner["collection"] => c !== null && COLLECTIONS.includes(c);

/**
 * POST /api/upload?collection=<pages|projects|tracks|apply>&owner=<key, slug or id>: the editor's image
 * upload. The browser sends the file here, and this passes it on to the admin API with
 * the token, which never leaves the editor's server. Answers `{ key, url }` or `{ error }`.
 *
 * Or JSON `{ url }` with a Google Drive share link: the file is fetched from Drive and
 * uploaded the same way, so the site serves it from the media bucket.
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
  let contentType = request.headers.get("content-type") ?? "";
  let body = request.body;
  if (contentType.startsWith("application/json")) {
    const fromDrive = await fetchFromDrive(await request.json().catch(() => null));
    if ("error" in fromDrive) return Response.json({ error: fromDrive.error }, { status: 400 });
    ({ body, contentType } = fromDrive);
  }
  if (!contentType.startsWith("multipart/form-data") || !body) {
    return Response.json({ error: "Send the file as multipart/form-data, in a field named file" }, { status: 400 });
  }

  try {
    return Response.json(await uploadFile({ collection, owner }, body, contentType), { status: 201 });
  } catch (error) {
    if (error instanceof AdminApiError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
}

/** The largest Drive file fetched: the server's own ceiling for FILE_SIZE_LIMIT, which checks the real limit. */
const DRIVE_MAX_BYTES = 100 * 1024 * 1024;

/** Downloads a shared Drive file and wraps it as a multipart body with one `file` field. */
async function fetchFromDrive(json: unknown): Promise<{ body: ReadableStream<Uint8Array<ArrayBuffer>>; contentType: string } | { error: string }> {
  const url = json && typeof json === "object" && "url" in json && typeof json.url === "string" ? json.url : "";
  const id = driveFileId(url);
  if (!id) return { error: "Send a Google Drive share link" };
  const notShared = { error: "Google Drive did not give the file. Share it as \"Anyone with the link\" and try again." };
  let response: Response;
  try {
    // Only this fixed Drive host is fetched, never the URL as sent.
    response = await fetch(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`, {
      cache: "no-store",
    });
  } catch {
    return { error: "Google Drive could not be reached. Try again." };
  }
  // A private file answers a sign-in page, not the file.
  if (!response.ok || (response.headers.get("content-type") ?? "").startsWith("text/html")) return notShared;
  if (Number(response.headers.get("content-length") ?? 0) > DRIVE_MAX_BYTES) return { error: "The file is too large." };
  // shortcut: the file is held in memory (up to DRIVE_MAX_BYTES) to build the multipart body; stream it if larger files are allowed.
  const form = new FormData();
  form.append("file", await response.blob(), "drive");
  const wrapped = new Response(form);
  return { body: wrapped.body as ReadableStream<Uint8Array<ArrayBuffer>>, contentType: wrapped.headers.get("content-type")! };
}
