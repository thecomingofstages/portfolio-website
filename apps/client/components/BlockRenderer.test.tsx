import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { homePage } from "@/fixtures/home";
import { projectPages } from "@/fixtures/projects";
import { TCOS2_SLUG } from "@/fixtures";
import type { Block } from "@/types/api";
import BlockRenderer from "./BlockRenderer";
import type { BlockComponents } from "./blocks";

const testComponents: BlockComponents = {
  hero: ({ block }) => <p>hero {block.subtitle}</p>,
  article: ({ block }) => <p>article {block.id}</p>,
};

describe("BlockRenderer", () => {
  it("renders Home's fixture, including sprint 2 and 3 blocks, without errors", () => {
    const { container } = render(<BlockRenderer blocks={homePage.blocks} />);
    expect(container).toBeTruthy();
  });

  it("renders the project fixture without errors", () => {
    expect(() => render(<BlockRenderer blocks={projectPages[TCOS2_SLUG].blocks} />)).not.toThrow();
  });

  it("renders known types in order, with the block id as the anchor", () => {
    const { container } = render(<BlockRenderer blocks={homePage.blocks} components={testComponents} />);
    const sections = [...container.querySelectorAll("section")];
    expect(sections.map((section) => section.id)).toEqual(["hero", "about", "support", "support-benefits"]);
    expect(sections[0].textContent).toBe("hero <...>");
  });

  it("skips unknown types and types without a component", () => {
    const blocks = [
      { id: "map", type: "map", title: null },
      { id: "join", type: "join", title: null, project_slug: null, empty_text: null, rounds: [] },
      { id: "a", type: "article", title: null, body: "", image: null, image_side: null },
      { id: "proto", type: "constructor", title: null },
    ] as unknown as Block[];
    const { container } = render(<BlockRenderer blocks={blocks} components={testComponents} />);
    expect([...container.querySelectorAll("section")].map((section) => section.id)).toEqual(["a"]);
  });
});
