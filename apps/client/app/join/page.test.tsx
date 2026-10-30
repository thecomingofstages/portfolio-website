import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JOIN_EMPTY_TEXT } from "@/components/blocks/Join";
import { tcos2Round5 } from "@/fixtures/shared";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));

const getOpenRounds = vi.fn();
vi.mock("@/lib/api", () => ({ getOpenRounds: () => getOpenRounds() }));

const { default: JoinPage } = await import("./page");

describe("Join page", () => {
  beforeEach(() => {
    getOpenRounds.mockReset();
  });

  it("shows one RoundCard per open round, in the order sent", async () => {
    getOpenRounds.mockResolvedValue([tcos2Round5, { ...tcos2Round5, title: "second round" }]);
    render(await JoinPage());
    expect(screen.getAllByRole("article")).toHaveLength(2);
    const titles = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(titles).toEqual([tcos2Round5.title, "second round"]);
    // The round fixture holds `<...>` placeholders too, so check that the list is the last thing shown.
    expect(document.querySelector("h1 + div > :last-child")?.tagName).toBe("UL");
  });

  it("shows the empty-state message, not an error, when no round is open", async () => {
    getOpenRounds.mockResolvedValue([]);
    render(await JoinPage());
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
    expect(screen.getByText(JOIN_EMPTY_TEXT)).toBeDefined();
    expect(screen.queryByRole("article")).toBeNull();
  });

  it("lets API errors reach error.tsx", async () => {
    getOpenRounds.mockRejectedValue(new Error("API answered 500 for /api/join"));
    await expect(JoinPage()).rejects.toThrow("500");
  });
});
