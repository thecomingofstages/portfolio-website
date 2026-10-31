import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { tcos2Round5 } from "@/fixtures/shared";
import { formatDate } from "@/lib/dates";
import type { Round } from "@/types/api";
import RoundCard, { APPLY_LABEL } from "./RoundCard";

const round: Round = { ...tcos2Round5, apply_url: "https://forms.gle/example" };

describe("RoundCard", () => {
  const headerDates = (container: HTMLElement) => container.querySelector("header time")?.textContent;

  it("shows the title, project name and dates from opens_at to closes_at", () => {
    const { container } = render(<RoundCard round={round} />);

    expect(screen.getByRole("heading", { level: 2, name: round.title })).not.toBeNull();
    expect(screen.getByText(round.project_name!)).not.toBeNull();
    expect(headerDates(container)).toBe(formatDate(round.opens_at, round.closes_at));
  });

  it("shows extended_to instead of closes_at when the round was extended", () => {
    const extended: Round = { ...round, extended_to: "2025-05-08T00:00:00.000Z" };
    const { container } = render(<RoundCard round={extended} />);

    expect(headerDates(container)).toBe(formatDate(extended.opens_at, extended.extended_to));
  });

  it("includes the qualifications, positions and timeline", () => {
    render(<RoundCard round={round} />);

    expect(screen.getByText("อายุอยู่ในช่วง 14–22 ปี")).not.toBeNull();
    expect(screen.getByRole("heading", { level: 3, name: round.positions[0].title })).not.toBeNull();
    expect(screen.getByText(round.timeline[1].event_name)).not.toBeNull();
  });

  it("links both Apply buttons to apply_url in a new tab", () => {
    render(<RoundCard round={round} />);

    const applyLinks = screen.getAllByRole("link", { name: APPLY_LABEL });
    expect(applyLinks).toHaveLength(2);
    for (const apply of applyLinks) {
      expect(apply.getAttribute("href")).toBe(round.apply_url);
      expect(apply.getAttribute("target")).toBe("_blank");
      expect(apply.getAttribute("rel")).toContain("noopener");
    }
  });

  it("leaves out the Apply button without a usable apply_url", () => {
    const { rerender } = render(<RoundCard round={{ ...round, apply_url: null }} />);
    expect(screen.queryByRole("link", { name: APPLY_LABEL })).toBeNull();

    rerender(<RoundCard round={{ ...round, apply_url: "<...>" }} />);
    expect(screen.queryByRole("link", { name: APPLY_LABEL })).toBeNull();
  });

  it("shows the poster with alt text, and no poster frame when poster is null", () => {
    const { container, rerender } = render(<RoundCard round={{ ...round, poster: "https://media.example/poster.webp" }} />);
    expect(screen.getByRole("img", { name: round.title })).not.toBeNull();

    rerender(<RoundCard round={{ ...round, poster: null }} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("[data-placeholder]")).toBeNull();
  });

  it("leaves out the project name when the round is not tied to a project", () => {
    render(<RoundCard round={{ ...round, project_name: null }} />);
    expect(screen.queryByText(tcos2Round5.project_name!)).toBeNull();
  });
});
