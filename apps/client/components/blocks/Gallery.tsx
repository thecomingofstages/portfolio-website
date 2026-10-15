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
      {/* Images sit side by side in rows like a brick wall, all the same size (project lead, PR #10 review).
          TODO(gallery columns): how many per row is not decided; one on phones, two from 768px, three from 1024px. */}
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 md:items-start">
        {items.map((item, index) => (
          <li key={`${item.url}-${index}`}>
            <figure className="flex flex-col gap-2">
              {/* Every image fills a 3:2 frame and is cropped to fit (project lead, PR #10 review),
                  unlike other images on the site, which show whole. */}
              <div className="relative aspect-[3/2] w-full overflow-hidden">
                <Media
                  src={item.url}
                  alt={item.alt ?? ""}
                  fill
                  sizes="(min-width: 1024px) 27vw, (min-width: 768px) 40vw, 90vw"
                  className="object-cover"
                />
              </div>
              {item.desc ? <figcaption className="text-muted">{item.desc}</figcaption> : null}
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
