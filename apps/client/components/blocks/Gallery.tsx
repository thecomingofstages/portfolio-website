import Media from "@/components/Media";
import type { BlockProps } from ".";

/**
 * Many images, each with its description under it (docs/DATABASE.md "gallery").
 * The Artwork gallery is the same block with different items.
 */
export default function Gallery({ block }: BlockProps<"gallery">) {
  const { title, items } = block;

  return (
    <div className="flex flex-col gap-6 py-8">
      {title ? <h2>{title}</h2> : null}
      {/* TODO(gallery columns): the docs give no layout; one column on phones, two from 768px, three from 1024px. */}
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 md:items-start">
        {items.map((item, index) => (
          <li key={`${item.url}-${index}`}>
            <figure className="flex flex-col gap-2">
              {/* The API sends no width or height: each image shows whole, in its own proportions,
                  never cropped (project lead, 13 Oct 2026). 3:2 is only the space held before it loads. */}
              <Media
                src={item.url}
                alt={item.alt ?? ""}
                width={1200}
                height={800}
                sizes="(min-width: 1024px) 27vw, (min-width: 768px) 40vw, 90vw"
                style={{ width: "100%", height: "auto" }}
                className="aspect-[auto_3/2]"
              />
              {item.desc ? <figcaption className="text-muted">{item.desc}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
