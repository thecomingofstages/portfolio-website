import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { tcos2Round5 } from "@/fixtures/shared";
import type { Qualifications as QualificationsType } from "@/types/api";
import Qualifications from "./Qualifications";

const fixtureQualifications: QualificationsType = tcos2Round5.qualifications!;

describe("Qualifications", () => {
  it("shows the age range in Thai when both age_min and age_max are set", () => {
    const { container } = render(<Qualifications qualifications={fixtureQualifications} />);

    expect(screen.getByRole("heading", { level: 3, name: "คุณสมบัติผู้สมัคร" })).not.toBeNull();
    const ageParagraph = container.querySelector("p");
    expect(ageParagraph?.textContent).toBe(
      `${fixtureQualifications.age_min}–${fixtureQualifications.age_max} ปี`,
    );
  });

  it("shows only minimum age when only age_min is set, and only maximum age when only age_max is set", () => {
    const { container, rerender } = render(
      <Qualifications
        qualifications={{
          ...fixtureQualifications,
          age_max: null,
          items: [],
        }}
      />,
    );

    expect(container.querySelector("p")?.textContent).toBe(
      `อายุขั้นต่ำ ${fixtureQualifications.age_min} ปี`,
    );
    expect(screen.queryByText("อายุไม่เกิน")).toBeNull();

    rerender(
      <Qualifications
        qualifications={{
          ...fixtureQualifications,
          age_min: null,
          items: [],
        }}
      />,
    );

    expect(container.querySelector("p")?.textContent).toBe(
      `อายุไม่เกิน ${fixtureQualifications.age_max} ปี`,
    );
    expect(screen.queryByText("อายุขั้นต่ำ")).toBeNull();
  });

  it("shows age_note on its own line when set (with or without ages) and leaves it out when null or empty", () => {
    const { container, rerender } = render(
      <Qualifications
        qualifications={{
          ...fixtureQualifications,
          age_note: "<...>",
        }}
      />,
    );

    const paragraphs = [...container.querySelectorAll("p")].map((p) => p.textContent);
    expect(paragraphs).toEqual([
      `${fixtureQualifications.age_min}–${fixtureQualifications.age_max} ปี`,
      "<...>",
    ]);

    rerender(
      <Qualifications
        qualifications={{
          age_min: null,
          age_max: null,
          age_note: "<...>",
          items: [],
        }}
      />,
    );
    const noteOnlyParagraphs = [...container.querySelectorAll("p")].map((p) => p.textContent);
    expect(noteOnlyParagraphs).toEqual(["<...>"]);

    rerender(<Qualifications qualifications={{ ...fixtureQualifications, age_note: "   " }} />);
    const paragraphsWithoutNote = [...container.querySelectorAll("p")].map((p) => p.textContent);
    expect(paragraphsWithoutNote).toEqual([
      `${fixtureQualifications.age_min}–${fixtureQualifications.age_max} ปี`,
    ]);
  });

  it("renders items in a ul/li in the exact order sent", () => {
    const orderedItems = ["<...>", "14", "22"];
    const { container } = render(
      <Qualifications
        qualifications={{
          age_min: null,
          age_max: null,
          age_note: null,
          items: orderedItems,
        }}
      />,
    );

    const ul = container.querySelector("ul");
    expect(ul).not.toBeNull();

    const listItems = [...container.querySelectorAll("ul > li")].map((li) => li.textContent);
    expect(listItems).toEqual(orderedItems);
  });

  it("renders nothing when all fields are empty or qualifications is null", () => {
    const { container, rerender } = render(
      <Qualifications
        qualifications={{
          age_min: null,
          age_max: null,
          age_note: null,
          items: [],
        }}
      />,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("heading")).toBeNull();

    rerender(<Qualifications qualifications={null} />);
    expect(container.firstChild).toBeNull();
  });
});
