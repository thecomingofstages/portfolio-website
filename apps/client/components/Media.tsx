import Image, { type ImageProps } from "next/image";

export type MediaProps = Omit<ImageProps, "src" | "alt"> & {
  /** An image URL, normally from the R2 media bucket (MEDIA_BASE_URL). */
  src: string | null | undefined;
  /** Required. Use "" only for images that are purely decorative. */
  alt: string;
};

/** True for an absolute http(s) URL or a site path; false for `<...>` placeholders. */
export function isImageUrl(src: string | null | undefined): src is string {
  return typeof src === "string" && (/^https?:\/\//.test(src) || src.startsWith("/"));
}

/**
 * Every image on the site goes through Media: next/image (resized, lazy-loaded)
 * with a required alt. A missing image, or a `<...>` placeholder from the
 * fixtures, renders as an empty frame of the same size instead of failing.
 */
export default function Media({ src, alt, className, fill, width, height, style, ...rest }: MediaProps) {
  if (!isImageUrl(src)) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        data-placeholder=""
        className={`block bg-card-bg ${fill ? "absolute inset-0" : ""} ${className ?? ""}`}
        style={fill ? style : { width, height, ...style }}
      />
    );
  }
  return (
    <Image src={src} alt={alt} className={className} fill={fill} width={width} height={height} style={style} {...rest} />
  );
}
