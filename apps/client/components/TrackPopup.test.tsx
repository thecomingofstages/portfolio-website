import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { trackDetails } from "@/fixtures/tracks";
import type { TrackDetail } from "@/types/api";
import TrackPopup from "./TrackPopup";

const itTrack = trackDetails.it;

describe("TrackPopup", () => {
  it("shows display_name and desc", () => {
    render(<TrackPopup track={{ ...itTrack, desc: "<...>\n<second line>" }} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("IT");
    expect(screen.getByText(/second line/)).toBeDefined();
  });

  it("shows every picture of the track", () => {
    const { container } = render(<TrackPopup track={{ ...itTrack, achievements: [], pics: ["/a.webp", "/b.webp"] }} />);
    expect(container.querySelectorAll("img")).toHaveLength(2);
  });

  it("shows each achievement's year, text, pics and project name as plain text", () => {
    const track: TrackDetail = {
      ...itTrack,
      achievements: [{ year: 2025, text: "<text>", pics: ["/p.webp"], project_name: "<project>" }],
    };
    const { container } = render(<TrackPopup track={track} />);
    expect(screen.getByText("2025")).toBeDefined();
    expect(screen.getByText("<text>")).toBeDefined();
    expect(screen.getByText("<project>").closest("a")).toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });

  it("has no links, team list or positions", () => {
    render(<TrackPopup track={itTrack} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("leaves out the year when it is null", () => {
    render(<TrackPopup track={{ ...itTrack, achievements: [{ year: null, text: "<text>", pics: [], project_name: "<project>" }] }} />);
    expect(screen.getByText("<project>").parentElement?.children).toHaveLength(1);
  });

  it("shows no achievements section, desc or pictures when there are none", () => {
    const { container } = render(<TrackPopup track={{ ...trackDetails.production, desc: null }} />);
    expect(screen.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
    expect(container.querySelector("p")).toBeNull();
    expect(container.querySelector("ul")).toBeNull();
  });
});
