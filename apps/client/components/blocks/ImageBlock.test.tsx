import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TCOS2_SLUG } from "@/fixtures";
import { projectPages } from "@/fixtures/projects";
import type { ImageBlock as ImageBlockData } from "@/types/api";
import ImageBlock from "./ImageBlock";

const base: ImageBlockData = {
  id: "set-photo",
  type: "image",
  title: null,
  url: "/a.webp",
  alt: "<what the picture shows, for screen readers>",
  caption: "<...>",
  credit: "<photographer>",
  size: null,
};

describe("ImageBlock", () => {
  it("shows the image with its alt, and caption and credit under it", () => {
    const { container } = render(<ImageBlock block={base} />);
    const image = screen.getByRole("img", { name: "<what the picture shows, for screen readers>" });
    const caption = container.querySelector("figcaption")!;
    expect(caption.textContent).toBe("<...><photographer>");
    expect(image.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("uses an empty alt when the block has none", () => {
    const { container } = render(<ImageBlock block={{ ...base, alt: null }} />);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
  });

  it("leaves the caption out when there is no caption or credit", () => {
    const { container } = render(<ImageBlock block={{ ...base, caption: null, credit: null }} />);
    expect(container.querySelector("figcaption")).toBeNull();
  });

  it("shows only the parts of the caption that are sent", () => {
    const { container } = render(<ImageBlock block={{ ...base, caption: null }} />);
    expect(container.querySelector("figcaption")?.textContent).toBe("<photographer>");
  });

  it("shows the title as a heading only when there is one", () => {
    const { unmount } = render(<ImageBlock block={base} />);
    expect(screen.queryByRole("heading")).toBeNull();
    unmount();
    render(<ImageBlock block={{ ...base, title: "<...>" }} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("<...>");
  });

  it("runs a large image the full content width, and a normal one narrower", () => {
    const narrow = (size: ImageBlockData["size"]) => {
      const { container, unmount } = render(<ImageBlock block={{ ...base, size }} />);
      const result = container.querySelector("figure")!.classList.contains("md:w-2/3");
      unmount();
      return result;
    };
    expect(narrow("large")).toBe(false);
    expect(narrow("normal")).toBe(true);
    expect(narrow(null)).toBe(true);
  });

  it("renders the project fixture's team photo, placeholder included", () => {
    const block = projectPages[TCOS2_SLUG].blocks.find((b) => b.type === "image");
    expect(block?.type).toBe("image");
    if (block?.type !== "image") return;
    const { container } = render(<ImageBlock block={block} />);
    expect(container.querySelector("[data-placeholder]")).not.toBeNull();
    expect(container.querySelector("figure")!.classList.contains("md:w-2/3")).toBe(false);
  });
});
