import Media from "@/components/Media";
import type { BlockProps } from ".";

/**
 * One picture (docs/DATABASE.md "image"), with the optional `title` above it and
 * `caption` and `credit` under it. `size: "large"` runs the full content width
 * (the team photo); `normal`, or no size, is narrower from 768px up.
 */
export default function ImageBlock({ block }: BlockProps<"image">) {
  const { title, url, alt, caption, credit, size } = block;
  const large = size === "large";

  return (
    <div className="flex flex-col gap-6 py-8">
      {title ? <h2 data-field="title">{title}</h2> : null}
      {/* TODO(normal image width): the docs only say a normal image is not full width; it takes two thirds from 768px up. */}
      <figure className={`flex flex-col gap-2 ${large ? "" : "md:w-2/3"}`}>
        {/* The API sends no width or height: the image shows whole, in its own proportions,
            never cropped (project lead, 13 Oct 2026). 3:2 is only the space held before it loads. */}
        <Media
          src={url}
          alt={alt ?? ""}
          data-field="url"
          data-field-kind="image"
          width={1200}
          height={800}
          sizes={large ? "(min-width: 768px) 80vw, 90vw" : "(min-width: 768px) 54vw, 90vw"}
          style={{ width: "100%", height: "auto" }}
          className="aspect-[auto_3/2]"
        />
        {caption || credit ? (
          <figcaption className="flex flex-col text-muted">
            {caption ? <span data-field="caption">{caption}</span> : null}
            {credit ? <span data-field="credit">{credit}</span> : null}
          </figcaption>
        ) : null}
      </figure>
    </div>
  );
}
