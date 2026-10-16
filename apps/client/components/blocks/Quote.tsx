import Media from "@/components/Media";
import type { BlockProps } from ".";

/**
 * A quote (docs/DATABASE.md "quote"): `text`, then `who` and `role`, over
 * `background_image` under a #000 layer at 75% so the text stays readable, or
 * on the card colour when there is no image.
 */
export default function Quote({ block }: BlockProps<"quote">) {
  const { title, text, who, role, background_image } = block;
  // TODO(quote background_color): the project lead asked for no inline style here yet (13 Oct 2026),
  // and there is no token for it in globals.css, so `background_color` is not used; the card colour shows instead.

  return (
    <div className="flex flex-col gap-6 py-8">
      {title ? <h2>{title}</h2> : null}
      <figure className="grid overflow-hidden rounded-card bg-card-bg">
        {background_image ? (
          <>
            {/* The picture shows whole, never cropped (project lead, 13 Oct 2026): when the text is
                taller than the picture, the card colour fills the space under it. */}
            <Media
              src={background_image}
              alt=""
              width={1200}
              height={800}
              sizes="(min-width: 768px) 80vw, 90vw"
              style={{ width: "100%", height: "auto" }}
              className="col-start-1 row-start-1 self-start aspect-[auto_3/2]"
            />
            <div aria-hidden="true" className="col-start-1 row-start-1 bg-background/75" />
          </>
        ) : null}
        <div className="relative col-start-1 row-start-1 flex flex-col justify-center gap-4 p-6 md:p-12">
          <blockquote className="font-heading text-h3">
            <p>{text}</p>
          </blockquote>
          <figcaption className="flex flex-col">
            <span>{who}</span>
            {role ? <span className="text-muted">{role}</span> : null}
          </figcaption>
        </div>
      </figure>
    </div>
  );
}
