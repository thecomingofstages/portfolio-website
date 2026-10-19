"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Media, { isImageUrl } from "@/components/Media";
import type { BlockProps } from ".";

/** The client's default for `slide_seconds: null` (docs/FRONTEND.md "Content blocks"). */
export const DEFAULT_SLIDE_SECONDS = 5;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

// TODO(shared Button): the project lead wants one Button component for Hero, ButtonBlock and Join
// (13 Oct 2026), but no task owns its file yet, so these classes copy ButtonBlock's for now.
const BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-button px-6 py-2.5 font-semibold transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-accent";
const PRIMARY_CLASS = "bg-accent text-background hover:bg-accent-hover";
const SECONDARY_CLASS = "border border-accent text-accent hover:border-accent-hover hover:text-accent-hover";

const MEDIA_CLASS = "col-start-1 row-start-1 self-start aspect-[auto_3/2]";
const MEDIA_SIZES = "(min-width: 768px) 80vw, 90vw";

/**
 * True when the device asks for reduced motion; follows changes to the setting. Starts as `null`
 * (not known yet, and always on the server), so nothing moves before the setting is read.
 */
function useReducedMotion(): boolean | null {
  return useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => null);
}

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION).matches;
}

function PauseButton({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  // TODO(hero pause label): the docs give no wording for this button; the English label follows Shelf's.
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={paused ? "Play" : "Pause"}
      className="relative z-10 col-start-1 row-start-1 m-4 self-end justify-self-end rounded-button bg-background/75 p-2 text-foreground focus-visible:outline-2 focus-visible:outline-accent"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        {paused ? <path d="M8 5v14l11-7z" /> : <path d="M6 5h4v14H6zm8 0h4v14h-4z" />}
      </svg>
    </button>
  );
}

/**
 * The top of Home (docs/DATABASE.md "hero"): `media_url` as an image, a muted looping video or a
 * slideshow, under a #000 layer at 75%, with `title`, `subtitle` and `buttons` on top. Media shows
 * whole at the content width, never cropped (project lead, 13 Oct 2026). With reduced motion the
 * video stays stopped and a slideshow shows `media_url` only.
 */
export default function Hero({ block }: BlockProps<"hero">) {
  const { title, subtitle, media_url, media_kind, slides, slide_seconds, buttons } = block;
  // TODO(hero media_kind null): the docs do not say what `null` shows; it shows the image, as for "image".
  const kind = media_kind ?? "image";
  // TODO(hero height): the docs give no height, so the hero is as tall as its media, or its text when that is taller.

  const motionAllowed = useReducedMotion() === false;
  const [paused, setPaused] = useState(false);
  const [current, setCurrent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const frames = kind === "slideshow" ? [media_url, ...slides] : [media_url];
  const slideshowRuns = kind === "slideshow" && frames.length > 1 && motionAllowed;
  const videoPlays = kind === "video" && isImageUrl(media_url) && motionAllowed;
  const seconds = slide_seconds ?? DEFAULT_SLIDE_SECONDS;
  const shown = motionAllowed ? current : 0;

  useEffect(() => {
    if (!slideshowRuns || paused) return;
    const timer = setTimeout(() => setCurrent((index) => (index + 1) % frames.length), seconds * 1000);
    return () => clearTimeout(timer);
  }, [slideshowRuns, paused, current, frames.length, seconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (videoPlays && !paused) {
      // Browsers may refuse to autoplay; the video then stays on its first frame.
      video.play()?.catch(() => {});
    } else {
      video.pause();
    }
  }, [videoPlays, paused]);

  return (
    <section className="grid overflow-hidden rounded-card bg-card-bg">
      {kind === "video" ? (
        isImageUrl(media_url) ? (
          <video
            ref={videoRef}
            src={media_url}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="col-start-1 row-start-1 h-auto w-full self-start"
          />
        ) : (
          <Media
            src={media_url}
            alt=""
            width={1200}
            height={800}
            style={{ width: "100%", height: "auto" }}
            className={MEDIA_CLASS}
          />
        )
      ) : (
        frames.map((src, index) => (
          <Media
            key={`${src}-${index}`}
            src={src}
            alt=""
            width={1200}
            height={800}
            sizes={MEDIA_SIZES}
            priority={index === 0}
            style={{ width: "100%", height: "auto" }}
            aria-hidden={index === shown ? undefined : true}
            className={`${MEDIA_CLASS} transition-opacity duration-700 motion-reduce:transition-none ${
              index === shown ? "opacity-100" : "opacity-0"
            }`}
          />
        ))
      )}
      <div aria-hidden="true" className="col-start-1 row-start-1 bg-background/75" />
      <div className="relative col-start-1 row-start-1 flex flex-col items-start justify-center gap-4 p-6 md:p-12">
        {title ? <h1>{title}</h1> : null}
        {subtitle ? <p className="text-body-lg text-muted">{subtitle}</p> : null}
        {buttons.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {buttons.map((button, index) => (
              <a
                key={`${button.url}-${index}`}
                href={button.url}
                className={`${BUTTON_CLASS} ${button.style === "secondary" ? SECONDARY_CLASS : PRIMARY_CLASS}`}
              >
                {button.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
      {slideshowRuns || videoPlays ? <PauseButton paused={paused} onToggle={() => setPaused((p) => !p)} /> : null}
    </section>
  );
}
