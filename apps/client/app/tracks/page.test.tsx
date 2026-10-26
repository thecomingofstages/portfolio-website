import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { trackList } from "@/fixtures/tracks";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));

const getTracks = vi.fn();
vi.mock("@/lib/api", () => ({ getTracks: () => getTracks() }));

const { default: TracksPage } = await import("./page");

describe("Tracks page", () => {
  beforeEach(() => {
    getTracks.mockReset();
  });

  it("lists the tracks from the API", async () => {
    getTracks.mockResolvedValue(structuredClone(trackList));
    render(await TracksPage());
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
    expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/tracks/it",
      "/tracks/production",
    ]);
  });

  it("still renders when no track is shown", async () => {
    getTracks.mockResolvedValue([]);
    render(await TracksPage());
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("lets API errors reach error.tsx", async () => {
    getTracks.mockRejectedValue(new Error("API answered 500 for /api/tracks"));
    await expect(TracksPage()).rejects.toThrow("500");
  });
});
