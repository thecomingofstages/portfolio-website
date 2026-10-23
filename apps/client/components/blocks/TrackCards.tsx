import Link from "next/link";
import Media from "@/components/Media";
import type { BlockProps } from ".";

/**
 * The `tracks` block on Home (task 3.2, docs/DATABASE.md "`tracks`: department
 * cards"): one card per track, in the order the API sends, showing
 * `display_name` and `pics[0]`. Every card links to `/tracks`.
 */
export default function TrackCards({ block }: BlockProps<"tracks">) {
  const { title, tracks } = block;

  // TODO(empty tracks block wording): nothing is shown when no track is sent.
  if (!tracks || tracks.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-8">
      {title ? <h2 className="font-heading text-h2 font-bold text-foreground">{title}</h2> : null}

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {tracks.map((track) => (
          <li key={track.key}>
            <Link
              href="/tracks"
              className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-card-bg transition-colors hover:border-accent-hover focus-visible:outline-2 focus-visible:outline-accent"
            >
              {/* TODO(track card image ratio): 3:2 like the gallery, cropped to fit. */}
              <div className="relative aspect-[3/2] w-full overflow-hidden">
                {/* The name is the link text below, so the picture is decorative. */}
                <Media
                  src={track.pics[0]}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 27vw, 45vw"
                  className="object-cover"
                />
              </div>
              <h3 className="p-3 font-heading text-h3 font-semibold text-foreground break-words md:p-4">
                {track.display_name}
              </h3>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}