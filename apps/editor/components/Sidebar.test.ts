import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isActivePath } from "./Sidebar";

const active = (pathname: string) => NAV_ITEMS.filter((item) => isActivePath(pathname, item)).map((item) => item.label);

describe("isActivePath", () => {
  it("marks Dashboard only on the start", () => {
    expect(active("/")).toEqual(["Dashboard"]);
  });

  it("marks the section an editor route belongs to", () => {
    expect(active("/projects/some-slug")).toEqual(["Projects"]);
    expect(active("/new/project")).toEqual(["Projects"]);
    expect(active("/apply/abc")).toEqual(["Recruitment rounds"]);
    expect(active("/new/track")).toEqual(["Tracks"]);
    expect(active("/pages/home")).toEqual(["Pages"]);
  });

  it("does not match a path that only shares a prefix", () => {
    expect(active("/projectsx")).toEqual([]);
  });
});
