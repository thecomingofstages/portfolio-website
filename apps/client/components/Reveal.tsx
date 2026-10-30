"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** What fades in: the parts of each block (its heading, text, grid), and list items such as cards. */
export const REVEAL_TARGETS = "main section[id] > * > *, main li";

/**
 * Fades page parts in the first time they come into view (globals.css `[data-reveal]`).
 * Only parts below the window when the page opens are hidden first, so nothing on screen
 * blinks. Without JavaScript, with reduced motion, and in edit mode everything just shows.
 * shortcut: parts that stream in after the page has rendered are not faded; watch the page
 * with a MutationObserver if that matters.
 */
export default function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/edit") || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const show = (el: HTMLElement, delay: number) => {
      el.style.transitionDelay = `${delay}ms`;
      el.dataset.reveal = "shown";
      // Once faded in, the element keeps none of this: its own transitions and styles apply again.
      const done = (event: TransitionEvent) => {
        if (event.target !== el) return;
        el.removeEventListener("transitionend", done);
        delete el.dataset.reveal;
        el.style.transitionDelay = "";
      };
      el.addEventListener("transitionend", done);
    };

    const observer = new IntersectionObserver((entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, i) => {
          observer.unobserve(entry.target);
          // Parts that come into view together follow each other, a little apart.
          show(entry.target as HTMLElement, Math.min(i, 5) * 80);
        });
    });
    for (const el of document.querySelectorAll<HTMLElement>(REVEAL_TARGETS)) {
      if (el.dataset.reveal || el.getBoundingClientRect().top < window.innerHeight) continue;
      el.dataset.reveal = "hidden";
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
      // Nothing stays hidden once nobody is watching for it. Unmarked, not faded in: a run
      // that starts again (a new page, React's dev double run) hides what is still below.
      for (const el of document.querySelectorAll<HTMLElement>('[data-reveal="hidden"]')) delete el.dataset.reveal;
    };
  }, [pathname]);

  return null;
}
