import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { homePage } from "@/fixtures/home";
import type { ArticleBlock } from "@/types/api";
import Article from "./Article";

const base: ArticleBlock = {
  id: "about",
  type: "article",
  title: "<...>",
  body: "<Markdown text>",
  image: "/a.webp",
  image_side: "right",
};

describe("Article", () => {
  it("renders the title as a heading and the body as Markdown, without raw HTML", () => {
    const { container } = render(
      <Article block={{ ...base, body: "- one\n- **two**\n\n[link](/join)\n\n<script>alert(1)</script>" }} />,
    );
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("<...>");
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector("strong")?.textContent).toBe("two");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/join");
    expect(container.querySelector("script")).toBeNull();
  });

  it("leaves the heading out when title is null", () => {
    render(<Article block={{ ...base, title: null }} />);
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("leaves the image out when image is null", () => {
    const { container } = render(<Article block={{ ...base, image: null, image_side: null }} />);
    expect(container.querySelector("img, [data-placeholder]")).toBeNull();
    expect(container.querySelector(".grid")).toBeNull();
  });

  it("puts the image before the text in the markup, so it stacks above on a phone", () => {
    for (const image_side of ["left", "right", "top"] as const) {
      const { container, unmount } = render(<Article block={{ ...base, body: "body text", image_side }} />);
      const image = container.querySelector("img")!;
      const text = screen.getByText("body text");
      expect(image.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(image.getAttribute("alt")).toBe("");
      unmount();
    }
  });

  it("sets the image beside the text for left and right, and above it for top", () => {
    const side = (image_side: ArticleBlock["image_side"]) => {
      const { container, unmount } = render(<Article block={{ ...base, image_side }} />);
      const result = {
        twoColumns: container.querySelector(".md\\:grid-cols-2") !== null,
        imageLast: container.querySelector("img")!.classList.contains("md:order-2"),
      };
      unmount();
      return result;
    };
    expect(side("left")).toEqual({ twoColumns: true, imageLast: false });
    expect(side("right")).toEqual({ twoColumns: true, imageLast: true });
    expect(side("top")).toEqual({ twoColumns: false, imageLast: false });
    expect(side(null)).toEqual({ twoColumns: false, imageLast: false });
  });

  it("renders Home's article blocks, placeholders included", () => {
    const articles = homePage.blocks.filter((block) => block.type === "article");
    const { container } = render(
      <>
        {articles.map((block) => (
          <Article key={block.id} block={block} />
        ))}
      </>,
    );
    expect(articles).toHaveLength(3);
    expect(container.querySelectorAll("[data-placeholder]")).toHaveLength(1);
  });
});
