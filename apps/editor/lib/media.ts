/** The R2 media bucket's public URL: the only host the site shows pictures from (docs/FRONTEND.md "Images"). */
const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, "") ?? "";

export const OFF_SITE_IMAGE =
  "Use a Google Drive share link or a link from the media bucket. For a picture from another website, download it and upload the file.";

/** The file types an upload may be: the server's list (apps/server upload.helper.ts). */
export const IMAGE_TYPES = "image/jpeg,image/png,image/gif,image/webp,image/avif";
export const VIDEO_TYPES = "video/mp4,video/webm";

/** True for a URL of a file in the media bucket: the site's next/image takes no other host. */
export function isMediaUrl(url: string): boolean {
  return mediaBase !== "" && url.trim().startsWith(`${mediaBase}/`);
}

/** The bucket's object key of a media URL ("<base>/pages/home/x.jpg" → "pages/home/x.jpg"), or null. */
export function mediaKey(url: string): string | null {
  return isMediaUrl(url) ? url.trim().slice(mediaBase.length + 1) : null;
}

/** Every media bucket URL anywhere in `value` (a block, a document), each once. */
export function mediaUrlsIn(value: unknown): string[] {
  const found = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === "string") {
      if (isMediaUrl(v)) found.add(v.trim());
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(value);
  return [...found];
}

/**
 * The file id of a Google Drive share link, or null for any other URL.
 * Takes drive.google.com/file/d/<id>/view, drive.google.com/open?id=<id> and …/uc?id=<id>.
 */
export function driveFileId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || !["drive.google.com", "docs.google.com"].includes(parsed.hostname)) return null;
  const id = parsed.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] ?? parsed.searchParams.get("id");
  return id && /^[\w-]{10,}$/.test(id) ? id : null;
}
