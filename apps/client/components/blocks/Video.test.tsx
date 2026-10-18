import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TCOS2_SLUG } from "@/fixtures";
import { projectPages } from "@/fixtures/projects";
import type { VideoBlock } from "@/types/api";
import Video, { embedUrl } from "./Video";

type ObserverInstance = {
  target: Element;
  callback: IntersectionObserverCallback;
  disconnect: ReturnType<typeof vi.fn>;
};

let observers: ObserverInstance[] = [];

beforeEach(() => {
  observers = [];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      callback: IntersectionObserverCallback;
      disconnect = vi.fn();
      unobserve = vi.fn();
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
      }
      observe(target: Element) {
        observers.push({ target, callback: this.callback, disconnect: this.disconnect });
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function scrollIntoView(index?: number) {
  const list = index === undefined ? observers : [observers[index]];
  act(() => {
    for (const obs of list) {
      obs.callback([{ isIntersecting: true, target: obs.target } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
  });
}

const allProviders: VideoBlock = {
  id: "videos",
  type: "video",
  title: "<...>",
  videos: [
    {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      provider: "youtube",
      title: "<episode 1>",
      caption: "<caption 1>",
    },
    {
      url: "https://www.tiktok.com/@thecomingofstages/video/7123456789",
      provider: "tiktok",
      title: "<episode 2>",
      caption: null,
    },
    {
      url: "https://www.instagram.com/reel/CxYz123AbC/",
      provider: "instagram",
      title: null,
      caption: "<caption 3>",
    },
    {
      url: "https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/view?usp=sharing",
      provider: "drive",
      title: null,
      caption: null,
    },
  ],
};

describe("Video", () => {
  it("loads no embed before its item scrolls near the screen", () => {
    const { container } = render(<Video block={allProviders} />);
    expect(container.querySelectorAll("iframe")).toHaveLength(0);
    expect(observers).toHaveLength(4);
  });

  it("embeds only the item that scrolled into view, and disconnects its observer", () => {
    const { container } = render(<Video block={allProviders} />);
    scrollIntoView(0);

    const iframes = container.querySelectorAll("iframe");
    expect(iframes).toHaveLength(1);
    expect(iframes[0].getAttribute("src")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(iframes[0].getAttribute("title")).toBe("<episode 1>");
    expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it("embeds all four providers (youtube, tiktok, instagram, drive) when in view", () => {
    const { container } = render(<Video block={allProviders} />);
    scrollIntoView();

    const srcs = [...container.querySelectorAll("iframe")].map((el) => el.getAttribute("src"));
    expect(srcs).toEqual([
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.tiktok.com/embed/v2/7123456789",
      "https://www.instagram.com/reel/CxYz123AbC/embed",
      "https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/preview",
    ]);
  });

  it("converts short and alternate provider URLs to embed URLs", () => {
    expect(embedUrl("https://youtu.be/abc123XYZ", "youtube")).toBe("https://www.youtube.com/embed/abc123XYZ");
    expect(embedUrl("https://www.youtube.com/shorts/short99", "youtube")).toBe("https://www.youtube.com/embed/short99");
    expect(embedUrl("https://www.instagram.com/p/PostCode1/", "instagram")).toBe(
      "https://www.instagram.com/p/PostCode1/embed",
    );
    expect(embedUrl("https://drive.google.com/open?id=DriveId99", "drive")).toBe(
      "https://drive.google.com/file/d/DriveId99/preview",
    );
    expect(embedUrl("https://www.youtube.com/watch?v=<id>", "youtube")).toBeNull();
  });

  it("shows each video's title and caption only when present", () => {
    const { container } = render(<Video block={allProviders} />);
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(4);

    expect(items[0].querySelector("h3")?.textContent).toBe("<episode 1>");
    expect(items[0].querySelector("figcaption")?.textContent).toBe("<caption 1>");

    expect(items[1].querySelector("h3")?.textContent).toBe("<episode 2>");
    expect(items[1].querySelector("figcaption")).toBeNull();

    expect(items[2].querySelector("h3")).toBeNull();
    expect(items[2].querySelector("figcaption")?.textContent).toBe("<caption 3>");

    expect(items[3].querySelector("h3")).toBeNull();
    expect(items[3].querySelector("figcaption")).toBeNull();
  });

  it("shows the block title as an h2 heading only when there is one", () => {
    const { unmount } = render(<Video block={allProviders} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("<...>");
    unmount();

    render(<Video block={{ ...allProviders, title: null }} />);
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });

  it("renders the project fixture's video block, placeholders included", () => {
    const block = projectPages[TCOS2_SLUG].blocks.find((b) => b.type === "video");
    expect(block?.type).toBe("video");
    if (block?.type !== "video") return;

    const { container } = render(<Video block={block} />);
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelectorAll("[data-placeholder]")).toHaveLength(2);
    expect(container.querySelectorAll("iframe")).toHaveLength(0);
  });
});
