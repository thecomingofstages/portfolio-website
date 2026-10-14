import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { homePage } from "@/fixtures/home";
import type { SponsorsBlock } from "@/types/api";
import Sponsors from "./Sponsors";

const base: SponsorsBlock = {
  id: "partners",
  type: "sponsors",
  title: "ผู้สนับสนุน",
  project_slug: null,
  tiers: [],
  sponsors: [
    {
      name: "Sponsor A",
      logo: "/logo-a.webp",
      tier: "Main Sponsor",
    },
    {
      name: "Sponsor B",
      logo: null,
      tier: "Main Sponsor",
    },
    {
      name: "Sponsor C",
      logo: "/logo-c.webp",
      tier: "Co-Sponsor",
    },
  ],
};

describe("Sponsors", () => {
  it("renders all sponsor names and groups by tier", () => {
    const { container } = render(<Sponsors block={base} />);

    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("ผู้สนับสนุน");

    const tierHeadings = screen.getAllByRole("heading", { level: 3 });
    expect(tierHeadings.map((h) => h.textContent)).toEqual(["Main Sponsor", "Co-Sponsor"]);

    // Sponsor A has logo
    const imgA = screen.getByRole("img", { name: "Sponsor A" });
    expect(imgA).toBeDefined();

    // Sponsor B has no logo, renders name as text in the logo area
    expect(screen.getByText("Sponsor B")).toBeDefined();
    // No img for Sponsor B
    expect(screen.queryByRole("img", { name: "Sponsor B" })).toBeNull();

    // Total 3 sponsors
    const listItems = container.querySelectorAll("li");
    expect(listItems).toHaveLength(3);
  });

  it("renders a plain list when no sponsor has a tier", () => {
    const blockNoTiers: SponsorsBlock = {
      ...base,
      sponsors: [
        { name: "Alpha", logo: null, tier: null },
        { name: "Beta", logo: "/beta.webp", tier: null },
      ],
    };

    render(<Sponsors block={blockNoTiers} />);

    // No tier headings (h3)
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);

    expect(screen.getByText("Alpha")).toBeDefined();
    expect(screen.getByRole("img", { name: "Beta" })).toBeDefined();
  });

  it("renders nothing when sponsors array is empty", () => {
    const { container } = render(<Sponsors block={{ ...base, sponsors: [] }} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Home fixture partners block correctly", () => {
    const homeSponsors = homePage.blocks.find((b) => b.type === "sponsors") as SponsorsBlock;
    expect(homeSponsors).toBeDefined();

    render(<Sponsors block={homeSponsors} />);
    // Lido Connect has logo: null in fixture
    expect(screen.getByText("Lido Connect")).toBeDefined();
  });
});
