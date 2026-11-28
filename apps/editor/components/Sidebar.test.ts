import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isActivePath } from "./Sidebar";

const active = (pathname: string) => NAV_ITEMS.filter((item) => isActivePath(pathname, item)).map((item) => item.label);

describe("isActivePath", () => {
  it("marks the item a list, edit or create page belongs to", () => {
    expect(active("/pages/home")).toEqual(["Pages"]);
    expect(active("/projects")).toEqual(["Projects"]);
    expect(active("/projects/some-slug")).toEqual(["Projects"]);
    expect(active("/new/project")).toEqual(["Projects"]);
    expect(active("/apply")).toEqual(["Recruitment rounds"]);
    expect(active("/apply/abc")).toEqual(["Recruitment rounds"]);
    expect(active("/new/track")).toEqual(["Tracks"]);
  });

  it("does not match a path that only shares a prefix", () => {
    expect(active("/projectsx")).toEqual([]);
  });
});
