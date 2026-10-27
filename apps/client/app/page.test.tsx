import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { homePage } from "@/fixtures/home";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  notFound: () => notFound(),
}));

const getHomePage = vi.fn();
vi.mock("@/lib/api", () => ({ getHomePage: () => getHomePage() }));

const { default: Home } = await import("./page");

describe("Home page", () => {
  beforeEach(() => {
    getHomePage.mockReset();
    notFound.mockClear();
  });

  it("renders the home blocks in order, each under its id", async () => {
    getHomePage.mockResolvedValue(structuredClone(homePage));
    const { container } = render(await Home());
    const ids = [...container.querySelectorAll(":scope > div > section")].map((section) => section.id);
    // Blocks without a component yet (stats, yearbook) render nothing.
    expect(ids).toEqual(["hero", "about", "projects", "tracks", "join", "quote", "support", "support-benefits", "support-email", "partners"]);
    expect(notFound).not.toHaveBeenCalled();
  });

  it("shows 404 when the home page is not shown", async () => {
    getHomePage.mockResolvedValue(null);
    await expect(Home()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
  });
});
