import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { projectPages } from "@/fixtures/projects";
import { TCOS2_NAME, TCOS2_SLUG } from "@/fixtures/shared";
import ProjectHeader from "./ProjectHeader";

describe("ProjectHeader", () => {
  const fixtureProject = projectPages[TCOS2_SLUG];
  const baseProject = {
    name: TCOS2_NAME,
    start_date: fixtureProject.start_date,
    end_date: fixtureProject.end_date,
    venue: fixtureProject.venue,
    pics: ["/a.webp"],
  };

  it("renders project name as h1", () => {
    render(<ProjectHeader project={baseProject} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe(TCOS2_NAME);
  });

  it("renders date range when end_date exists", () => {
    render(<ProjectHeader project={baseProject} />);
    expect(screen.getByText("28 มิถุนายน 2568 – 29 มิถุนายน 2568")).not.toBeNull();
  });

  it("renders single date when end_date is null or empty", () => {
    render(<ProjectHeader project={{ ...baseProject, end_date: null }} />);
    expect(screen.getByText("28 มิถุนายน 2568")).not.toBeNull();
  });

  it("renders venue only when set", () => {
    const { rerender } = render(<ProjectHeader project={baseProject} />);
    expect(screen.getByText(fixtureProject.venue!)).not.toBeNull();

    rerender(<ProjectHeader project={{ ...baseProject, venue: null }} />);
    expect(screen.queryByText(fixtureProject.venue!)).toBeNull();
  });

  it("renders cover image with alt matching project name", () => {
    render(<ProjectHeader project={baseProject} />);
    const img = screen.getByRole("img", { name: baseProject.name });
    expect(img).not.toBeNull();
    expect(img.tagName).toBe("IMG");
  });

  it("handles empty pics array without rendering broken image", () => {
    const { container } = render(<ProjectHeader project={{ ...baseProject, pics: [] }} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("handles placeholder cover image correctly via Media component", () => {
    render(<ProjectHeader project={{ ...baseProject, pics: ["<cover image URL>"] }} />);
    const placeholder = screen.getByRole("img", { name: baseProject.name });
    expect(placeholder.getAttribute("data-placeholder")).not.toBeNull();
    expect(placeholder.tagName).not.toBe("IMG");
  });

  it("does not render the yearbook button (task 3.8)", () => {
    render(<ProjectHeader project={baseProject} />);
    expect(screen.queryByRole("link", { name: /yearbook/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /yearbook/i })).toBeNull();
  });
});
