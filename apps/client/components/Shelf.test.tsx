import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Shelf from "./Shelf";
import type { ProjectCard } from "@/types/api";

const mockProjects: ProjectCard[] = [
  {
    slug: "tcos-2026",
    name: "TCOS 2026 Project",
    start_date: "2026-02-10T00:00:00.000Z",
    pics: ["/a.webp"],
  },
  {
    slug: "tcos-2025",
    name: "TCOS 2025 Project",
    start_date: "2025-06-28T00:00:00.000Z",
    pics: [],
  },
  {
    slug: "tcos-2024",
    name: "TCOS 2024 Project",
    start_date: "2024-05-15T00:00:00.000Z",
    pics: ["/b.webp"],
  },
];

describe("Shelf", () => {
  it("renders an empty shelf without crashing when projects list is empty", () => {
    const { container } = render(<Shelf projects={[]} />);
    expect(screen.getByText("No projects found.")).not.toBeNull();
    expect(container.querySelector("[role='listbox']")).toBeNull();
  });

  it("renders shelf spines and selects first project by default", () => {
    render(<Shelf projects={mockProjects} />);
    const link = screen.getByRole("link", { name: /TCOS 2026 Project/i });
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe("/projects/tcos-2026");
  });

  it("filters projects by year when filter tabs are on", () => {
    render(<Shelf projects={mockProjects} showFilter={true} />);

    // Check year buttons exist
    const allBtn = screen.getByRole("button", { name: "ALL" });
    const year2025Btn = screen.getByRole("button", { name: "2025" });
    expect(allBtn).not.toBeNull();
    expect(year2025Btn).not.toBeNull();

    // Click year 2025
    fireEvent.click(year2025Btn);
    expect(screen.getByRole("link", { name: /TCOS 2025 Project/i })).not.toBeNull();

    // Return to ALL
    fireEvent.click(allBtn);
    expect(screen.getByRole("link", { name: /TCOS 2026 Project/i })).not.toBeNull();
  });

  it("toggles reverse order on screen without mutating the original array", () => {
    const originalClone = [...mockProjects];
    render(<Shelf projects={mockProjects} showToggle={true} />);

    const toggleBtn = screen.getByRole("button", { name: /Newest first/i });
    expect(toggleBtn).not.toBeNull();

    // Click reverse toggle
    fireEvent.click(toggleBtn);

    // Oldest project (2024) should now be the first item selected
    expect(screen.getByRole("link", { name: /TCOS 2024 Project/i })).not.toBeNull();

    // Verify original array was not mutated
    expect(mockProjects[0].slug).toBe(originalClone[0].slug);
    expect(mockProjects[1].slug).toBe(originalClone[1].slug);
    expect(mockProjects[2].slug).toBe(originalClone[2].slug);
  });

  it("navigates selection with left and right buttons and keyboard arrows", () => {
    render(<Shelf projects={mockProjects} />);

    const nextBtn = screen.getByRole("button", { name: "Next project" });
    const prevBtn = screen.getByRole("button", { name: "Previous project" });

    // Click next
    fireEvent.click(nextBtn);
    expect(screen.getByRole("link", { name: /TCOS 2025 Project/i })).not.toBeNull();

    // Click prev
    fireEvent.click(prevBtn);
    expect(screen.getByRole("link", { name: /TCOS 2026 Project/i })).not.toBeNull();

    // ArrowRight key on container
    const listbox = screen.getByRole("listbox");
    fireEvent.keyDown(listbox, { key: "ArrowRight" });
    expect(screen.getByRole("link", { name: /TCOS 2025 Project/i })).not.toBeNull();

    // ArrowLeft key
    fireEvent.keyDown(listbox, { key: "ArrowLeft" });
    expect(screen.getByRole("link", { name: /TCOS 2026 Project/i })).not.toBeNull();
  });

  it("shows See all link when showSeeAll is on", () => {
    render(<Shelf projects={mockProjects} showSeeAll={true} />);
    const seeAllLink = screen.getByRole("link", { name: "See all →" });
    expect(seeAllLink).not.toBeNull();
    expect(seeAllLink.getAttribute("href")).toBe("/projects");
  });

  it("handles empty pics array without rendering broken image", () => {
    const noPicProject: ProjectCard[] = [
      {
        slug: "no-pic",
        name: "No Pic",
        start_date: "2025-01-01T00:00:00.000Z",
        pics: [],
      },
    ];
    const { container } = render(<Shelf projects={noPicProject} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-placeholder]")).not.toBeNull();
  });
});
