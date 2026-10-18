import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { QuoteBlock } from "@/types/api";
import Quote from "./Quote";

const base: QuoteBlock = {
  id: "quote",
  type: "quote",
  title: null,
  text: "<quote text>",
  who: "<who>",
  role: "<role>",
  background_image: "/a.webp",
  background_color: null,
};

describe("Quote", () => {
  it("shows the text in a blockquote, with who and role under it", () => {
    const { container } = render(<Quote block={base} />);
    expect(container.querySelector("blockquote")?.textContent).toBe("<quote text>");
    expect(container.querySelector("figcaption")?.textContent).toBe("<who><role>");
  });

  it("leaves the role out when there is none", () => {
    const { container } = render(<Quote block={{ ...base, role: null }} />);
    expect(container.querySelector("figcaption")?.textContent).toBe("<who>");
  });

  it("puts the background image under a dark layer, with an empty alt", () => {
    const { container } = render(<Quote block={base} />);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(container.querySelector(".bg-background\\/75")).not.toBeNull();
  });

  it("shows the card colour and no dark layer when there is no background image", () => {
    const { container } = render(<Quote block={{ ...base, background_image: null }} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".bg-background\\/75")).toBeNull();
    expect(container.querySelector("figure")?.className).toContain("bg-card-bg");
  });

  it("does not use background_color as an inline style", () => {
    const { container } = render(<Quote block={{ ...base, background_image: null, background_color: "<colour>" }} />);
    expect(container.querySelector("figure")?.getAttribute("style")).toBeNull();
  });

  it("shows the title as a heading only when there is one", () => {
    const { unmount } = render(<Quote block={base} />);
    expect(screen.queryByRole("heading")).toBeNull();
    unmount();
    render(<Quote block={{ ...base, title: "<...>" }} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("<...>");
  });
});
