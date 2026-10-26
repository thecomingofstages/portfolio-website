import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { blockComponents } from "@/components/blocks";
import { projectPages } from "@/fixtures/projects";
import { HIDDEN_SLUG, TCOS2_NAME, TCOS2_SLUG } from "@/fixtures/shared";

vi.mock("server-only", () => ({}));

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  notFound: () => notFound(),
}));

const getProject = vi.fn();
vi.mock("@/lib/api", () => ({ getProject: (slug: string) => getProject(slug) }));

const { default: ProjectPage } = await import("./page");

const params = (slug: string) => Promise.resolve({ slug });

describe("Project page", () => {
  beforeEach(() => {
    getProject.mockReset();
    notFound.mockClear();
  });

  it("renders the header, then the project's blocks in order, each under its id", async () => {
    const project = structuredClone(projectPages[TCOS2_SLUG]);
    getProject.mockResolvedValue(project);
    const { container } = render(await ProjectPage({ params: params(TCOS2_SLUG) }));

    expect(getProject).toHaveBeenCalledWith(TCOS2_SLUG);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(TCOS2_NAME);

    const children = [...container.querySelectorAll(":scope > div > *")];
    expect(children[0].tagName).toBe("HEADER");
    const ids = children.slice(1).map((section) => section.id);
    // Blocks without a component yet render nothing, so expect only the registered ones.
    const rendered = project.blocks.filter((block) => Object.hasOwn(blockComponents, block.type));
    expect(ids).toEqual(rendered.map((block) => block.id));
    expect(ids.length).toBeGreaterThan(0);
    expect(notFound).not.toHaveBeenCalled();
  });

  it("shows 404 for a missing or hidden slug", async () => {
    getProject.mockResolvedValue(null);
    await expect(ProjectPage({ params: params(HIDDEN_SLUG) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
  });
});
