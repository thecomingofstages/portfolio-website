import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TCOS2_SLUG } from "@/fixtures";
import { projectPages } from "@/fixtures/projects";
import type { HighlightsBlock } from "@/types/api";
import Highlights from "./Highlights";

const base: HighlightsBlock = {
  id: "highlights",
  type: "highlights",
  title: null,
  project_slug: null,
  limit: 6,
  highlights: [
    {
      event_name: "first event",
      date: "2025-06-28T00:00:00.000Z",
      venue: "first venue",
      desc: "first desc",
      pics: ["/a.webp", "/b.webp", "/c.webp"],
    },
    { event_name: "second event", date: null, venue: null, desc: null, pics: [] },
  ],
};

describe("Highlights", () => {
  it("shows one card per highlight, in the order sent", () => {
    render(<Highlights block={base} />);
    const names = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(names).toEqual(["first event", "second event"]);
  });

  it("shows the date in the site's date format, the venue and the desc", () => {
    render(<Highlights block={base} />);
    const card = screen.getAllByRole("article")[0];
    expect(card.querySelector("time")?.textContent).toBe("28 มิถุนายน 2568");
    expect(card.querySelector("time")?.getAttribute("datetime")).toBe("2025-06-28T00:00:00.000Z");
    expect(card.textContent).toContain("first venue");
    expect(card.textContent).toContain("first desc");
  });

  it("shows every picture: the cover with the event name as its alt, the rest decorative", () => {
    render(<Highlights block={base} />);
    const images = screen.getAllByRole("article")[0].querySelectorAll("img");
    expect([...images].map((image) => image.getAttribute("alt"))).toEqual(["first event", "", ""]);
  });

  it("leaves out the date line, desc and pictures when a highlight has none", () => {
    render(<Highlights block={base} />);
    const card = screen.getAllByRole("article")[1];
    expect(card.querySelector("img, [data-placeholder]")).toBeNull();
    expect(card.querySelector("time")).toBeNull();
    expect(card.querySelectorAll("p")).toHaveLength(0);
  });

  it("shows the title as a heading only when there is one", () => {
    const { unmount } = render(<Highlights block={{ ...base, title: "block title" }} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("block title");
    unmount();
    render(<Highlights block={base} />);
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });

  it("renders nothing when no highlight is sent", () => {
    const { container } = render(<Highlights block={{ ...base, highlights: [] }} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the project fixture's highlights", () => {
    const block = projectPages[TCOS2_SLUG].blocks.find((b) => b.type === "highlights");
    expect(block?.type).toBe("highlights");
    if (block?.type !== "highlights") return;
    render(<Highlights block={block} />);
    expect(screen.getAllByRole("article")).toHaveLength(block.highlights.length);
  });
});
