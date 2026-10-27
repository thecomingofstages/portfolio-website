import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { homePage } from "@/fixtures/home";
import { tcos2Round5 } from "@/fixtures/shared";
import type { JoinBlock } from "@/types/api";
import Join, { JOIN_EMPTY_TEXT } from "./Join";

const homeJoin = homePage.blocks.find((b) => b.type === "join") as JoinBlock;

describe("Join", () => {
  it("renders one RoundCard per round, in the order sent", () => {
    const second = { ...tcos2Round5, title: "second round" };
    render(<Join block={{ ...homeJoin, rounds: [tcos2Round5, second] }} />);

    const titles = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(titles).toEqual([tcos2Round5.title, "second round"]);
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("shows the block title above the rounds", () => {
    render(<Join block={{ ...homeJoin, title: "block title", rounds: [tcos2Round5] }} />);

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings[0]).toBe("block title");
  });

  it("shows the block's own empty_text when no round is open", () => {
    render(<Join block={{ ...homeJoin, rounds: [], empty_text: "nothing open" }} />);

    expect(screen.getByText("nothing open")).not.toBeNull();
    expect(screen.queryByRole("article")).toBeNull();
  });

  it("renders nothing when no round is open and there is no empty_text", () => {
    const { container } = render(<Join block={{ ...homeJoin, rounds: [], empty_text: null }} />);
    expect(container.innerHTML).toBe("");
  });

  it("exports the empty-state constant for /join", () => {
    expect(JOIN_EMPTY_TEXT).toBe("<...>");
  });
});
