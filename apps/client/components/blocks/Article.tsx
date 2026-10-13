import Media from "@/components/Media";
import { Markdown } from "@/lib/markdown";
import type { BlockProps } from ".";

// Spacing, lists and links for the rendered Markdown. Links stay the text colour, underlined.
const BODY_CLASS =
  "space-y-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-1 " +
  "[&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:decoration-2 " +
  "[&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-accent";

/**
 * A text section (docs/DATABASE.md "article"): the optional `title`, then `body`
 * as Markdown without raw HTML, with `image` on `image_side`. The image comes
 * first in the markup, so on a phone it stacks above the text.
 */
export default function Article({ block }: BlockProps<"article">) {
  const { title, body, image, image_side } = block;
  // TODO(image_side default): the docs give no side for an image whose image_side is null; it goes on top.
  const beside = image_side === "left" || image_side === "right";

  return (
    <div className="flex flex-col gap-6 py-8">
      {title ? <h2>{title}</h2> : null}
      <div className={image && beside ? "grid gap-6 md:grid-cols-2 md:items-start" : "flex flex-col gap-6"}>
        {image ? (
          // The block has no alt field, so the image is marked decorative. The API sends no
          // width or height: the image shows whole, in its own proportions, never cropped
          // (project lead, 13 Oct 2026). 3:2 is only the space held before it loads.
          <Media
            src={image}
            alt=""
            width={1200}
            height={800}
            sizes={beside ? "(min-width: 768px) 40vw, 90vw" : "(min-width: 768px) 80vw, 90vw"}
            style={{ width: "100%", height: "auto" }}
            className={`aspect-[auto_3/2] ${image_side === "right" ? "md:order-2" : ""}`}
          />
        ) : null}
        <Markdown className={BODY_CLASS}>{body}</Markdown>
      </div>
    </div>
  );
}
