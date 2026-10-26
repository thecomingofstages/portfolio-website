import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { trackList } from "@/fixtures/tracks";
import TrackList, { firstLine } from "./TrackList";

describe("TrackList", () => {
  it("renders one row per track, in the order sent, each linking to /tracks/<key>", () => {
    render(<TrackList tracks={trackList} />);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/tracks/it", "/tracks/production"]);
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(["IT", "<...>"]);
  });

  it("shows only the first line of desc", () => {
    render(<TrackList tracks={[{ key: "it", display_name: "IT", desc: "<...>\n<second line>" }]} />);
    expect(screen.getByText("<...>")).toBeDefined();
    expect(screen.queryByText(/second line/)).toBeNull();
  });

  it("shows no description when desc is null", () => {
    const { container } = render(<TrackList tracks={[{ key: "it", display_name: "IT", desc: null }]} />);
    expect(container.querySelector("p")).toBeNull();
  });

  it("renders nothing when no track is sent", () => {
    const { container } = render(<TrackList tracks={[]} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("firstLine", () => {
  it("skips blank lines and trims", () => {
    expect(firstLine("\n  <...>  \n<...>")).toBe("<...>");
  });

  it("returns null for null, empty or blank desc", () => {
    expect(firstLine(null)).toBeNull();
    expect(firstLine("")).toBeNull();
    expect(firstLine(" \n ")).toBeNull();
  });
});
