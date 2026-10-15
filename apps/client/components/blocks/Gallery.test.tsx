import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TCOS2_SLUG } from "@/fixtures";
import { projectPages } from "@/fixtures/projects";
import type { GalleryBlock } from "@/types/api";
import Gallery from "./Gallery";

const base: GalleryBlock = {
  id: "gallery",
  type: "gallery",
  title: "<...>",
  items: [
    { url: "/a.webp", alt: "<...>", desc: "<what happened in this photo>" },
    { url: "/b.webp", alt: null, desc: null },
  ],
};

describe("Gallery", () => {
  it("shows each item's image with its alt, and its desc under it", () => {
    const { container } = render(<Gallery block={base} />);
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(2);
    const image = items[0].querySelector("img")!;
    const desc = items[0].querySelector("figcaption")!;
    expect(image.getAttribute("alt")).toBe("<...>");
    expect(desc.textContent).toBe("<what happened in this photo>");
    expect(image.compareDocumentPosition(desc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("puts every image in a 3:2 frame that crops it to fit", () => {
    const { container } = render(<Gallery block={base} />);
    for (const item of container.querySelectorAll("li")) {
      const image = item.querySelector("img")!;
      expect(image.parentElement?.className).toContain("aspect-[3/2]");
      expect(image.className).toContain("object-cover");
    }
  });

  it("uses an empty alt and no caption when an item has neither", () => {
    const { container } = render(<Gallery block={base} />);
    const item = container.querySelectorAll("li")[1];
    expect(item.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(item.querySelector("figcaption")).toBeNull();
  });

  it("shows the title as a heading only when there is one", () => {
    const { unmount } = render(<Gallery block={base} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("<...>");
    unmount();
    render(<Gallery block={{ ...base, title: null }} />);
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("renders an empty list when there are no items", () => {
    const { container } = render(<Gallery block={{ ...base, items: [] }} />);
    expect(container.querySelectorAll("li")).toHaveLength(0);
  });

  it("renders the project fixture's gallery, placeholders included", () => {
    const block = projectPages[TCOS2_SLUG].blocks.find((b) => b.type === "gallery");
    expect(block?.type).toBe("gallery");
    if (block?.type !== "gallery") return;
    const { container } = render(<Gallery block={block} />);
    expect(container.querySelectorAll("[data-placeholder]")).toHaveLength(2);
    expect(container.querySelectorAll("figcaption")).toHaveLength(2);
  });
});
