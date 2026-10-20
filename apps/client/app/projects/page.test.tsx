import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { projectList } from "@/fixtures/projects";
import { TCOS2_NAME } from "@/fixtures/shared";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));

const getProjects = vi.fn();
vi.mock("@/lib/api", () => ({ getProjects: () => getProjects() }));

const { default: ProjectsPage } = await import("./page");

describe("Project list page", () => {
  beforeEach(() => {
    getProjects.mockReset();
  });

  it("renders the projects on the shelf, with the filter and the toggle on", async () => {
    getProjects.mockResolvedValue(structuredClone(projectList));
    render(await ProjectsPage());

    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(projectList.length);
    expect(screen.getByRole("link", { name: new RegExp(TCOS2_NAME) }).getAttribute("href")).toBe(
      `/projects/${encodeURIComponent(projectList[0].slug)}`,
    );
    expect(screen.getByRole("toolbar", { name: "Filter by year" })).not.toBeNull();
    expect(screen.getByRole("button", { name: /newest first/i })).not.toBeNull();
    expect(screen.queryByRole("link", { name: /see all/i })).toBeNull();
  });

  it("shows an empty shelf, not an error, when no project is shown", async () => {
    getProjects.mockResolvedValue([]);
    render(await ProjectsPage());

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByRole("heading", { level: 1 })).not.toBeNull();
  });
});
