"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoBlock } from "@/types/api";
import type { BlockProps } from ".";

type VideoItem = VideoBlock["videos"][number];

export function embedUrl(url: string, provider: VideoItem["provider"]): string | null {
  if (!url || /[<>]/.test(url)) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  switch (provider) {
    case "youtube": {
      const id =
        parsed.hostname === "youtu.be"
          ? parsed.pathname.slice(1).split("/")[0] || null
          : (parsed.searchParams.get("v") ?? parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] ?? null);
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }
    case "tiktok": {
      const id = parsed.pathname.match(/\/(?:video|embed(?:\/v2)?)\/([^/?#]+)/)?.[1] ?? null;
      return id ? `https://www.tiktok.com/embed/v2/${encodeURIComponent(id)}` : null;
    }
    case "instagram": {
      const match = parsed.pathname.match(/\/(p|reel|reels|tv)\/([^/?#]+)/);
      if (!match) return null;
      const kind = match[1] === "reels" ? "reel" : match[1];
      return `https://www.instagram.com/${kind}/${encodeURIComponent(match[2])}/embed`;
    }
    case "drive": {
      const id = parsed.pathname.match(/\/file\/d\/([^/?#]+)/)?.[1] ?? parsed.searchParams.get("id");
      return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` : null;
    }
    default:
      return null;
  }
}

function LazyEmbed({ src, title }: { src: string | null; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!src || !element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [src]);

  if (!src) {
    return <div data-placeholder="" aria-hidden="true" className="aspect-video w-full rounded-card bg-card-bg" />;
  }

  return (
    <div ref={ref} className="aspect-video w-full overflow-hidden rounded-card bg-card-bg">
      {inView ? (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />
      ) : null}
    </div>
  );
}

export default function Video({ block }: BlockProps<"video">) {
  const { title, videos } = block;

  return (
    <div className="flex flex-col gap-6 py-8">
      {title ? <h2>{title}</h2> : null}
      <ul className="flex flex-col gap-8">
        {videos.map((video, index) => {
          const src = embedUrl(video.url, video.provider);
          const frameTitle = video.title ?? title ?? `${video.provider} video`;
          return (
            <li key={`${video.url}-${index}`}>
              <figure className="flex flex-col gap-2">
                {video.title ? <h3>{video.title}</h3> : null}
                <LazyEmbed src={src} title={frameTitle} />
                {video.caption ? <figcaption className="text-muted">{video.caption}</figcaption> : null}
              </figure>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
