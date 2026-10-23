import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { homePage } from "@/fixtures/home";
import type { TracksBlock } from "@/types/api";
import TrackCards from "./TrackCards";

const homeTracks = homePage.blocks.find((b) => b.type === "tracks") as TracksBlock;

describe("TrackCards", () => {
  it("renders one card per track, in the order sent, each linking to /tracks", () => {
    render(<TrackCards block={homeTracks} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(homeTracks.tracks.length);
    expect(links.every((link) => link.getAttribute("href") === "/tracks")).toBe(true);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["IT", "<...>"]);
  });

  it("shows the block title", () => {
    render(<TrackCards block={{ ...homeTracks, title: "<title>" }} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("<title>");
  });

  it("shows pics[0] when the API sends one", () => {
    const { container } = render(
      <TrackCards block={{ ...homeTracks, tracks: [{ key: "it", display_name: "IT", desc: null, pics: ["/it.webp"] }] }} />,
    );
    expect(container.querySelector("img")?.getAttribute("src")).toContain("it.webp");
  });

  it("shows an empty frame when there is no picture", () => {
    const { container } = render(
      <TrackCards block={{ ...homeTracks, tracks: [{ key: "it", display_name: "IT", desc: null, pics: [] }] }} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-placeholder]")).not.toBeNull();
  });

  it("renders nothing when no track is sent", () => {
    const { container } = render(<TrackCards block={{ ...homeTracks, tracks: [] }} />);
    expect(container.innerHTML).toBe("");
  });
});
