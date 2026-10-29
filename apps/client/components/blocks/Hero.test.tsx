import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HeroBlock } from "@/types/api";
import Hero, { DEFAULT_SLIDE_SECONDS } from "./Hero";

const base: HeroBlock = {
  id: "hero",
  type: "hero",
  title: "<title>",
  subtitle: "<subtitle>",
  media_url: "/cover.webp",
  media_kind: "image",
  slides: [],
  slide_seconds: null,
  buttons: [{ label: "<...>", url: "/join", style: "primary" }],
};

const slideshow: HeroBlock = { ...base, media_kind: "slideshow", media_url: "/first.webp", slides: ["/second.webp", "/third.webp"] };

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

/** The `src` of the slide that is showing, decoded from next/image's URL. */
function shownSlide(container: HTMLElement): string | null {
  const shown = container.querySelector("img.opacity-100");
  const src = shown?.getAttribute("src") ?? "";
  return new URL(src, "http://localhost").searchParams.get("url") ?? src;
}

beforeEach(() => {
  mockReducedMotion(false);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Hero", () => {
  it("shows the title as the page heading, then the subtitle and the buttons", () => {
    render(<Hero block={base} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("<title>");
    expect(screen.getByText("<subtitle>")).not.toBeNull();
    const link = screen.getByRole("link", { name: "<...>" });
    expect(link.getAttribute("href")).toBe("/join");
    expect(link.className).toContain("bg-accent");
  });

  it("shows a secondary button in the outline style", () => {
    render(<Hero block={{ ...base, buttons: [{ label: "<...>", url: "/join", style: "secondary" }] }} />);
    expect(screen.getByRole("link").className).toContain("border-accent");
  });

  it("leaves out the title, subtitle and buttons when there are none", () => {
    render(<Hero block={{ ...base, title: null, subtitle: null, buttons: [] }} />);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("as the home banner, centres the logo, subtitle and buttons, with the title for screen readers", () => {
    const { container } = render(<Hero block={base} home />);
    expect(container.querySelector('img[src*="logo.png"]')).not.toBeNull();
    expect(screen.getByRole("heading", { level: 1 }).className).toContain("sr-only");
    expect(screen.getByText("<subtitle>").parentElement?.className).toContain("items-center");
    expect(screen.getByRole("link", { name: "<...>" }).getAttribute("href")).toBe("/join");
  });

  it("names the home banner's logo when there is no title", () => {
    render(<Hero block={{ ...base, title: null }} home />);
    expect(screen.getByRole("img", { name: "The Coming of Stages" })).not.toBeNull();
  });

  it("is a full-bleed banner with the image covering it", () => {
    const { container } = render(<Hero block={base} />);
    expect(container.querySelector("section")?.className).toContain("full-bleed");
    expect(container.querySelector("img")?.className).toContain("object-cover");
    expect(container.querySelector("img")?.getAttribute("sizes")).toBe("100vw");
  });

  it("shows an image under the dark layer, with an empty alt and no pause button", () => {
    const { container } = render(<Hero block={base} />);
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(container.querySelector(".bg-background\\/75")).not.toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the image when media_kind is null", () => {
    const { container } = render(<Hero block={{ ...base, media_kind: null }} />);
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container.querySelector("video")).toBeNull();
  });

  it("plays a video muted and looping, and the pause button stops it", () => {
    const { container } = render(<Hero block={{ ...base, media_kind: "video", media_url: "/cover.mp4" }} />);
    const video = container.querySelector("video");
    expect(video?.getAttribute("src")).toBe("/cover.mp4");
    expect(video?.muted).toBe(true);
    expect(video?.loop).toBe(true);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play" })).not.toBeNull();
  });

  it("keeps a video stopped, with no pause button, under reduced motion", () => {
    mockReducedMotion(true);
    render(<Hero block={{ ...base, media_kind: "video", media_url: "/cover.mp4" }} />);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows an empty frame for a placeholder video URL", () => {
    const { container } = render(<Hero block={{ ...base, media_kind: "video", media_url: "<cover video URL>" }} />);
    expect(container.querySelector("video")).toBeNull();
    const frame = container.querySelector<HTMLElement>("[data-placeholder]");
    expect(frame).not.toBeNull();
    // The frame fills the banner, not a fixed size (phone width).
    expect(frame?.className).toContain("absolute inset-0");
  });

  it("runs a slideshow from media_url through the slides, 5 seconds each by default", () => {
    vi.useFakeTimers();
    const { container } = render(<Hero block={slideshow} />);
    expect(container.querySelectorAll("img")).toHaveLength(3);
    expect(shownSlide(container)).toBe("/first.webp");

    act(() => vi.advanceTimersByTime(DEFAULT_SLIDE_SECONDS * 1000 - 1));
    expect(shownSlide(container)).toBe("/first.webp");
    act(() => vi.advanceTimersByTime(1));
    expect(shownSlide(container)).toBe("/second.webp");
    act(() => vi.advanceTimersByTime(DEFAULT_SLIDE_SECONDS * 1000));
    expect(shownSlide(container)).toBe("/third.webp");
    act(() => vi.advanceTimersByTime(DEFAULT_SLIDE_SECONDS * 1000));
    expect(shownSlide(container)).toBe("/first.webp");
  });

  it("uses slide_seconds when it is set", () => {
    vi.useFakeTimers();
    const { container } = render(<Hero block={{ ...slideshow, slide_seconds: 2 }} />);
    act(() => vi.advanceTimersByTime(2000));
    expect(shownSlide(container)).toBe("/second.webp");
  });

  it("hides the slides that are not showing from screen readers", () => {
    const { container } = render(<Hero block={slideshow} />);
    const hidden = container.querySelectorAll('img[aria-hidden="true"]');
    expect(hidden).toHaveLength(2);
  });

  it("stops the slideshow with the pause button", () => {
    vi.useFakeTimers();
    const { container } = render(<Hero block={slideshow} />);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => vi.advanceTimersByTime(DEFAULT_SLIDE_SECONDS * 3000));
    expect(shownSlide(container)).toBe("/first.webp");
  });

  it("shows media_url only, with no pause button, under reduced motion", () => {
    mockReducedMotion(true);
    vi.useFakeTimers();
    const { container } = render(<Hero block={slideshow} />);
    act(() => vi.advanceTimersByTime(DEFAULT_SLIDE_SECONDS * 3000));
    expect(shownSlide(container)).toBe("/first.webp");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
