import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { tcos2Round5 } from "@/fixtures/shared";
import type { Position } from "@/types/api";
import PositionList from "./PositionList";

const fixturePosition: Position = tcos2Round5.positions[0];

describe("PositionList", () => {
  it("renders a position with all fields and an audition", () => {
    const fullPosition: Position = {
      ...fixturePosition,
      unit_name: "<...>",
      description: "<...>",
      requirements: ["<...>"],
      portfolio_required: true,
      onsite_required: true,
      audition: {
        ...fixturePosition.audition!,
        pieces: ["<...>"],
        onsite: true,
      },
    };

    const { container } = render(<PositionList positions={[fullPosition]} />);

    expect(screen.getByRole("heading", { level: 3, name: fixturePosition.title })).not.toBeNull();
    expect(screen.getByText(fixturePosition.dept_name!)).not.toBeNull();
    expect(container.querySelector('[data-field="portfolio_required"]')).not.toBeNull();
    expect(container.querySelector('[data-field="onsite_required"]')).not.toBeNull();

    // Audition details
    expect(screen.getByRole("heading", { level: 4 })).not.toBeNull();
    expect(screen.getByText(fixturePosition.audition!.clip_brief!)).not.toBeNull();
    expect(screen.getByText(String(fixturePosition.audition!.clip_max_minutes))).not.toBeNull();
    expect(screen.getByText(fixturePosition.audition!.clip_file_name!)).not.toBeNull();
    expect(screen.getByText(fixturePosition.audition!.clip_upload!)).not.toBeNull();
    expect(container.querySelector('[data-field="audition_onsite"]')).not.toBeNull();
  });

  it("renders no audition section when a position has no audition or only clip_required", () => {
    const noAuditionPosition: Position = {
      ...fixturePosition,
      audition: null,
    };

    const { rerender } = render(<PositionList positions={[noAuditionPosition]} />);

    expect(screen.getByRole("heading", { level: 3, name: fixturePosition.title })).not.toBeNull();
    expect(screen.queryByRole("heading", { level: 4 })).toBeNull();

    rerender(
      <PositionList
        positions={[
          {
            ...fixturePosition,
            audition: {
              clip_required: true,
              clip_brief: null,
              clip_max_minutes: null,
              clip_file_name: null,
              clip_upload: null,
              pieces: [],
              onsite: false,
            },
          },
        ]}
      />,
    );

    expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
  });

  it("leaves out null or empty optional fields cleanly without rendering 'null'", () => {
    const minimalPosition: Position = {
      dept_key: fixturePosition.dept_key,
      dept_name: null,
      unit_name: null,
      title: fixturePosition.title,
      description: null,
      requirements: [],
      portfolio_required: null,
      onsite_required: null,
      audition: null,
    };

    const { container } = render(<PositionList positions={[minimalPosition]} />);

    expect(screen.getByRole("heading", { level: 3, name: fixturePosition.title })).not.toBeNull();
    expect(container.textContent).not.toContain("null");
    expect(container.textContent).not.toContain("undefined");
    expect(container.querySelector('[data-field="portfolio_required"]')).toBeNull();
    expect(container.querySelector('[data-field="onsite_required"]')).toBeNull();
    expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
  });

  it("shows portfolio and onsite flags when true and omits them when false or null", () => {
    const { container, rerender } = render(
      <PositionList
        positions={[
          {
            ...fixturePosition,
            portfolio_required: true,
            onsite_required: true,
            audition: {
              ...fixturePosition.audition!,
              onsite: true,
            },
          },
        ]}
      />,
    );

    expect(container.querySelector('[data-field="portfolio_required"]')).not.toBeNull();
    expect(container.querySelector('[data-field="onsite_required"]')).not.toBeNull();
    expect(container.querySelector('[data-field="audition_onsite"]')).not.toBeNull();

    rerender(
      <PositionList
        positions={[
          {
            ...fixturePosition,
            portfolio_required: false,
            onsite_required: false,
            audition: {
              ...fixturePosition.audition!,
              onsite: false,
            },
          },
        ]}
      />,
    );

    expect(container.querySelector('[data-field="portfolio_required"]')).toBeNull();
    expect(container.querySelector('[data-field="onsite_required"]')).toBeNull();
    expect(container.querySelector('[data-field="audition_onsite"]')).toBeNull();
  });

  it("preserves the exact order of positions and audition pieces sent by the API", () => {
    const orderedPieces = ["<...>", "5", "1"];
    const positions: Position[] = [
      {
        ...fixturePosition,
        title: fixturePosition.title,
        audition: {
          ...fixturePosition.audition!,
          pieces: orderedPieces,
        },
      },
      {
        ...fixturePosition,
        title: "<...>",
        audition: null,
      },
    ];

    const { container } = render(<PositionList positions={positions} />);

    const positionHeadings = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(positionHeadings).toEqual([fixturePosition.title, "<...>"]);

    const firstPositionItem = container.querySelector("section > ul > li") as HTMLElement;
    const pieceList = within(firstPositionItem).getAllByRole("listitem");
    expect(pieceList.map((li) => li.textContent)).toEqual(orderedPieces);
  });

  it("renders nothing when positions is empty or null", () => {
    const { container, rerender } = render(<PositionList positions={[]} />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("heading")).toBeNull();

    rerender(<PositionList positions={null} />);
    expect(container.firstChild).toBeNull();
  });
});
