import Media from "@/components/Media";
import type { BlockProps } from ".";

/**
 * A quote (docs/DATABASE.md "quote"): `text`, then `who` and `role`, over
 * `background_image` under a #000 layer at 75% so the text stays readable, or
 * on the card colour when there is no image. A full-bleed banner: full window
 * width, the picture covering it and cropped (project lead, 26 Oct 2026).
 */
export default function Quote({ block }: BlockProps<"quote">) {
  const { title, text, who, role, background_image } = block;
  // TODO(quote background_color): the project lead asked for no inline style here yet (13 Oct 2026),
  // and there is no token for it in globals.css, so `background_color` is not used; the card colour shows instead.

  return (
    <div className="flex flex-col gap-6 py-8">
      {title ? <h2 data-field="title">{title}</h2> : null}
      <figure className="full-bleed relative flex min-h-80 items-center overflow-hidden bg-card-bg">
        {background_image ? (
          <>
            <Media
              src={background_image}
              alt=""
              data-field="background_image"
              data-field-kind="image"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-background/75" />
          </>
        ) : null}
        <div className="page-width relative flex flex-col gap-4 py-12 md:py-16">
          <blockquote className="font-heading text-h3">
            <p data-field="text">{text}</p>
          </blockquote>
          <figcaption className="flex flex-col">
            <span data-field="who">{who}</span>
            {role ? (
              <span data-field="role" className="text-muted">
                {role}
              </span>
            ) : null}
          </figcaption>
        </div>
      </figure>
    </div>
  );
}
