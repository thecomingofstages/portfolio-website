import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const { default: Nav, isCurrent } = await import("./Nav");

describe("Nav", () => {
  it("links the logo to / and shows Projects, Tracks and Join", () => {
    pathname = "/";
    render(<Nav />);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["TCOS", "/"],
      ["Projects", "/projects"],
      ["Tracks", "/tracks"],
      ["Join", "/join"],
    ]);
  });

  it("marks the current section, including pages below it", () => {
    pathname = "/projects/tcos-2-the-hidden-saloon";
    render(<Nav />);
    const current = screen.getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page");
    expect(current.map((link) => link.textContent)).toEqual(["Projects"]);
    expect(current[0].className).toContain("text-gold");
  });

  it("does not treat a shared prefix as the same section", () => {
    expect(isCurrent("/joinery", "/join")).toBe(false);
    expect(isCurrent("/join", "/join")).toBe(true);
  });
});
