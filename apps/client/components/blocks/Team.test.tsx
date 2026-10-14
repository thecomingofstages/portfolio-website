import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Team from "./Team";

describe("Team block component", () => {
  it("renders default tracks list with proper titles and no open badge", () => {
    render(<Team />);
    expect(screen.getByRole("heading", { name: "Tracks (สายงาน)" })).toBeDefined();
    expect(screen.getByText("IT")).toBeDefined();
    expect(screen.getByText("Documentary")).toBeDefined();
    expect(screen.getByText("Finance")).toBeDefined();
    expect(screen.queryByText("open")).toBeNull();
  });

  it("opens popup modal when clicking a track and closes with Back", () => {
    render(<Team />);
    // Popup is initially closed
    expect(screen.queryByRole("dialog")).toBeNull();

    // Click track to open popup modal
    fireEvent.click(screen.getByText("IT"));
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByRole("heading", { name: "ผลงานที่เคยทำ" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "สมาชิกในสายงาน" })).toBeDefined();
    expect(screen.getAllByText("อธิบายโปรเจกต์").length).toBeGreaterThan(0);

    // Click Back to close popup modal
    fireEvent.click(screen.getByText("Back"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders with custom block data if departments are provided", () => {
    render(
      <Team
        block={{
          id: "team-test",
          type: "team",
          title: "Our Tracks",
          project_slug: null,
          dept_keys: [],
          show_org_chart: false,
          layout: "list",
          org_chart_image: null,
          departments: [
            {
              dept_key: "acting",
              dept_name: "Acting",
              members: [{ name: "Somchai", nickname: "Chai", position: "Lead", photo: null }],
            },
          ],
        }}
      />
    );
    expect(screen.getByRole("heading", { name: "Our Tracks" })).toBeDefined();
    expect(screen.getByText("Acting")).toBeDefined();
  });
});
