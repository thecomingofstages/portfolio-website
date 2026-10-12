import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "./markdown";

describe("Markdown", () => {
  it("renders Markdown", () => {
    const { container } = render(<Markdown>{"## Heading\n\n- one\n- **two**\n\n[link](https://example.com)"}</Markdown>);
    expect(container.querySelector("h2")?.textContent).toBe("Heading");
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector("strong")?.textContent).toBe("two");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("https://example.com");
  });

  it("does not render raw HTML", () => {
    const source = 'text <b>bold</b>\n\n<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n<div class="x">block</div>';
    const { container } = render(<Markdown>{source}</Markdown>);
    expect(container.querySelector("b")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("div.x")).toBeNull();
    expect(container.innerHTML).not.toContain("onerror");
  });

  it("removes javascript: links", () => {
    const { container } = render(<Markdown>{"[click](javascript:alert(1))"}</Markdown>);
    expect(container.querySelector("a")?.getAttribute("href") ?? "").not.toContain("javascript");
  });
});
