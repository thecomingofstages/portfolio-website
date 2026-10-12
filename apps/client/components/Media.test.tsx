import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Media, { isImageUrl } from "./Media";

describe("Media", () => {
  it("renders an image with its alt", () => {
    render(<Media src="/logo.png" alt="TCOS" width={100} height={50} />);
    expect(screen.getByRole("img", { name: "TCOS" }).tagName).toBe("IMG");
  });

  it("renders an empty frame for a placeholder or a missing image", () => {
    const { container } = render(
      <>
        <Media src="<cover image URL>" alt="cover" width={100} height={50} />
        <Media src={null} alt="" width={100} height={50} />
      </>,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("img", { name: "cover" }).hasAttribute("data-placeholder")).toBe(true);
    expect(container.querySelectorAll("[data-placeholder]")).toHaveLength(2);
  });

  it("tells URLs from placeholders", () => {
    expect(isImageUrl("https://media.example/a.webp")).toBe(true);
    expect(isImageUrl("/a.webp")).toBe(true);
    expect(isImageUrl("<...>")).toBe(false);
    expect(isImageUrl("")).toBe(false);
    expect(isImageUrl(undefined)).toBe(false);
  });
});
