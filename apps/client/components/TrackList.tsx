import Link from "next/link";
import type { TrackList as Tracks } from "@/types/api";

/** The first line of `desc`, or `null` when there is none. */
export function firstLine(desc: string | null): string | null {
  const line = desc?.split("\n").find((part) => part.trim() !== "")?.trim();
  return line ? line : null;
}

/**
 * `/tracks` (task 3.1, docs/FRONTEND.md "Sprint 3: Track, Yearbook"): one row
 * per track, in the order the API sends, each linking to `/tracks/<key>`.
 * Task 3.4 turns that link into the popup over this list.
 */
export default function TrackList({ tracks }: { tracks: Tracks }) {
  // TODO(empty /tracks wording): nothing is shown when no track is sent.
  if (tracks.length === 0) return null;

  return (
    <ul className="flex flex-col gap-3">
      {tracks.map((track) => {
        const line = firstLine(track.desc);
        return (
          <li key={track.key}>
            <Link
              href={`/tracks/${encodeURIComponent(track.key)}`}
              className="flex flex-col gap-1 rounded-card border border-border bg-card-bg p-4 transition-colors hover:border-accent-hover focus-visible:outline-2 focus-visible:outline-accent md:p-5"
            >
              <h2 className="text-h3 font-semibold text-foreground break-words">{track.display_name}</h2>
              {line ? <p className="text-body text-muted break-words">{line}</p> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
