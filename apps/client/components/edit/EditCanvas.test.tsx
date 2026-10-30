import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EditCanvas from "./EditCanvas";
import { originsOf } from "./draft";

const EDITOR = "http://editor.test";
const load = {
  tcos: "edit",
  type: "load",
  selected: null,
  labels: {},
  blocks: [{ id: "about", type: "article", is_shown: true, title: "From the editor", body: "", image: null, image_side: null }],
};

const send = (origin: string, source: Window | null = window) =>
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data: load, origin, source }));
  });

describe("edit mode", () => {
  it("ignores blocks from any origin but the editor's", () => {
    render(<EditCanvas editorOrigins={[EDITOR]} saved={[]} />);
    send("https://evil.example");
    expect(screen.queryByText("From the editor")).toBeNull();
    expect(screen.getByText("กำลังรอ editor…")).not.toBeNull();
  });

  it("ignores the editor's origin from a window other than the one framing it", () => {
    render(<EditCanvas editorOrigins={[EDITOR]} saved={[]} />);
    send(EDITOR, null);
    expect(screen.queryByText("From the editor")).toBeNull();
  });

  it("renders the editor's blocks with the site's components", () => {
    render(<EditCanvas editorOrigins={[EDITOR]} saved={[]} />);
    send(EDITOR);
    expect(screen.getByRole("heading", { name: "From the editor" })).not.toBeNull();
  });

  it("reads EDITOR_ORIGIN as a comma-separated list of origins, with or without a trailing slash", () => {
    expect(originsOf("http://localhost:3001/")).toEqual(["http://localhost:3001"]);
    expect(originsOf("https://editor.example/, http://localhost:3001")).toEqual(["https://editor.example", "http://localhost:3001"]);
    expect(originsOf("not a url")).toEqual([]);
    expect(originsOf(undefined)).toEqual([]);
  });

  it("takes blocks from any listed editor", () => {
    render(<EditCanvas editorOrigins={["https://other.test", EDITOR]} saved={[]} />);
    send(EDITOR);
    expect(screen.getByRole("heading", { name: "From the editor" })).not.toBeNull();
  });
});
