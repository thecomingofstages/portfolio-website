/** The R2 media bucket's public URL: the only host the site shows pictures from (docs/FRONTEND.md "Images"). */
const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, "") ?? "";

export const OFF_SITE_IMAGE = "Pictures from other websites can't be used. Download the picture and upload it instead.";

/**
 * Whether the site can show `url` as a picture. An absolute http(s) URL must be in the media
 * bucket, or the site's next/image throws. Anything else (empty, a site path, `<...>`) the site
 * either loads itself or shows as an empty frame.
 */
export function isAllowedImage(url: string): boolean {
  const value = url.trim();
  if (!/^https?:\/\//i.test(value)) return true;
  return mediaBase !== "" && value.startsWith(`${mediaBase}/`);
}
