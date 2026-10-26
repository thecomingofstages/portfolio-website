import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EditCanvas from "./EditCanvas";
import { originOf } from "./draft";

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
    render(<EditCanvas editorOrigin={EDITOR} saved={[]} />);
    send("https://evil.example");
    expect(screen.queryByText("From the editor")).toBeNull();
    expect(screen.getByText("กำลังรอ editor…")).not.toBeNull();
  });

  it("ignores the editor's origin from a window other than the one framing it", () => {
    render(<EditCanvas editorOrigin={EDITOR} saved={[]} />);
    send(EDITOR, null);
    expect(screen.queryByText("From the editor")).toBeNull();
  });

  it("renders the editor's blocks with the site's components", () => {
    render(<EditCanvas editorOrigin={EDITOR} saved={[]} />);
    send(EDITOR);
    expect(screen.getByRole("heading", { name: "From the editor" })).not.toBeNull();
  });

  it("reads EDITOR_ORIGIN as an origin, with or without a trailing slash", () => {
    expect(originOf("http://localhost:3001/")).toBe("http://localhost:3001");
    expect(originOf("not a url")).toBeNull();
    expect(originOf(undefined)).toBeNull();
  });
});
