import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Shelf from "./Shelf";
import { NO_YEARBOOK_SLUG, TCOS2_NAME, TCOS2_SLUG, noYearbookCard, tcos2Card } from "@/fixtures/shared";
import type { ProjectCard } from "@/types/api";

/** Dated copy of the placeholder card so the year filter has a second year. Name stays `<...>`. */
const olderPlaceholder: ProjectCard = {
  ...noYearbookCard,
  start_date: "2024-05-15T00:00:00.000Z",
};

const mockProjects: ProjectCard[] = [tcos2Card, olderPlaceholder];

function selectedProjectHref() {
  const links = screen.getAllByRole("link");
  const projectLink = links.find((link) => {
    const href = link.getAttribute("href");
    return href?.startsWith("/projects/") && href !== "/projects";
  });
  return projectLink?.getAttribute("href") ?? null;
}

describe("Shelf", () => {
  it("renders an empty shelf without crashing when projects list is empty", () => {
    const { container } = render(<Shelf projects={[]} />);
    expect(screen.getByText("No projects found.")).not.toBeNull();
    expect(container.querySelector("[role='listbox']")).toBeNull();
  });

  it("renders shelf spines and selects first project by default", () => {
    render(<Shelf projects={mockProjects} />);
    const link = screen.getByRole("link", {
      name: (accessibleName) => accessibleName.includes(TCOS2_NAME),
    });
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe(`/projects/${TCOS2_SLUG}`);
  });

  it("filters projects by year when filter tabs are on", () => {
    render(<Shelf projects={mockProjects} showFilter={true} />);

    const allBtn = screen.getByRole("button", { name: "ALL" });
    // Buddhist-era year, as the dates show it: 2024 is 2567.
    const year2024Btn = screen.getByRole("button", { name: "2567" });
    expect(allBtn).not.toBeNull();
    expect(year2024Btn).not.toBeNull();

    fireEvent.click(year2024Btn);
    expect(selectedProjectHref()).toBe(`/projects/${NO_YEARBOOK_SLUG}`);

    fireEvent.click(allBtn);
    expect(selectedProjectHref()).toBe(`/projects/${TCOS2_SLUG}`);
  });

  it("toggles reverse order on screen without mutating the original array", () => {
    const originalClone = [...mockProjects];
    render(<Shelf projects={mockProjects} showToggle={true} />);

    const toggleBtn = screen.getByRole("button", { name: /Newest first/i });
    expect(toggleBtn).not.toBeNull();

    fireEvent.click(toggleBtn);

    expect(selectedProjectHref()).toBe(`/projects/${NO_YEARBOOK_SLUG}`);

    expect(mockProjects[0].slug).toBe(originalClone[0].slug);
    expect(mockProjects[1].slug).toBe(originalClone[1].slug);
  });

  it("navigates selection with left and right buttons and keyboard arrows", () => {
    render(<Shelf projects={mockProjects} />);

    const nextBtn = screen.getByRole("button", { name: "Next project" });
    const prevBtn = screen.getByRole("button", { name: "Previous project" });

    fireEvent.click(nextBtn);
    expect(selectedProjectHref()).toBe(`/projects/${NO_YEARBOOK_SLUG}`);

    fireEvent.click(prevBtn);
    expect(selectedProjectHref()).toBe(`/projects/${TCOS2_SLUG}`);

    const listbox = screen.getByRole("listbox");
    fireEvent.keyDown(listbox, { key: "ArrowRight" });
    expect(selectedProjectHref()).toBe(`/projects/${NO_YEARBOOK_SLUG}`);

    fireEvent.keyDown(listbox, { key: "ArrowLeft" });
    expect(selectedProjectHref()).toBe(`/projects/${TCOS2_SLUG}`);
  });

  it("shows See all link when showSeeAll is on", () => {
    render(<Shelf projects={mockProjects} showSeeAll={true} />);
    const seeAllLink = screen.getByRole("link", { name: "See all →" });
    expect(seeAllLink).not.toBeNull();
    expect(seeAllLink.getAttribute("href")).toBe("/projects");
  });

  it("handles empty pics array without rendering broken image", () => {
    const { container } = render(<Shelf projects={[tcos2Card]} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-placeholder]")).not.toBeNull();
  });
});
