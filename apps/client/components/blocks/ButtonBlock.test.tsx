import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { homePage } from "@/fixtures/home";
import type { ButtonBlock as ButtonBlockData } from "@/types/api";
import ButtonBlock from "./ButtonBlock";

const contactBlock: ButtonBlockData = {
  id: "contact",
  type: "button",
  title: "<...>",
  align: "center",
  buttons: [
    {
      label: "Email",
      url: "mailto:official_account@thecomingofstages.com",
      style: "primary",
    },
    {
      label: "Instagram",
      url: "https://www.instagram.com/thecomingofstages",
      style: "secondary",
    },
    {
      label: "Join",
      url: "/join",
      style: null,
    },
  ],
};

describe("ButtonBlock", () => {
  it("renders primary buttons with gold background and black text, and secondary with outline style", () => {
    render(<ButtonBlock block={contactBlock} />);

    const emailLink = screen.getByRole("link", { name: "Email" });
    const instagramLink = screen.getByRole("link", { name: "Instagram" });
    const joinLink = screen.getByRole("link", { name: "Join" });

    expect(emailLink.className).toContain("bg-accent");
    expect(emailLink.className).toContain("text-background");
    expect(emailLink.className).toContain("rounded-button");

    expect(instagramLink.className).toContain("border");
    expect(instagramLink.className).toContain("border-accent");
    expect(instagramLink.className).toContain("text-accent");
    expect(instagramLink.className).not.toContain("bg-accent");

    expect(joinLink.className).toContain("bg-accent");
    expect(joinLink.className).toContain("text-background");
  });

  it("supports mailto:, external URLs, and internal paths", () => {
    render(<ButtonBlock block={contactBlock} />);

    expect(screen.getByRole("link", { name: "Email" }).getAttribute("href")).toBe(
      "mailto:official_account@thecomingofstages.com",
    );
    expect(screen.getByRole("link", { name: "Instagram" }).getAttribute("href")).toBe(
      "https://www.instagram.com/thecomingofstages",
    );
    expect(screen.getByRole("link", { name: "Join" }).getAttribute("href")).toBe("/join");
  });

  it("aligns buttons to the center or left based on align", () => {
    const { unmount } = render(<ButtonBlock block={{ ...contactBlock, align: "center" }} />);
    expect(screen.getByRole("link", { name: "Email" }).parentElement?.className).toContain("justify-center");
    unmount();

    const { unmount: unmountLeft } = render(<ButtonBlock block={{ ...contactBlock, align: "left" }} />);
    expect(screen.getByRole("link", { name: "Email" }).parentElement?.className).toContain("justify-start");
    unmountLeft();

    render(<ButtonBlock block={{ ...contactBlock, align: null }} />);
    expect(screen.getByRole("link", { name: "Email" }).parentElement?.className).toContain("justify-start");
  });

  it("shows the title as an h2 heading only when there is one", () => {
    const { unmount } = render(<ButtonBlock block={contactBlock} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("<...>");
    unmount();

    render(<ButtonBlock block={{ ...contactBlock, title: null }} />);
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("renders Home's button block fixture", () => {
    const block = homePage.blocks.find((b) => b.type === "button");
    expect(block?.type).toBe("button");
    if (block?.type !== "button") return;

    render(<ButtonBlock block={block} />);
    const link = screen.getByRole("link", { name: "<...>" });
    expect(link.getAttribute("href")).toBe("mailto:official_account@thecomingofstages.com");
    expect(link.className).toContain("bg-accent");
  });
});
