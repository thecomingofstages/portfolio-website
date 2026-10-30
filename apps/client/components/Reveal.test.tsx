import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Reveal from "./Reveal";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

/** The fake IntersectionObserver's callback and what it watches. */
let report: (targets: Element[]) => void;
let watched: Element[] = [];

class FakeObserver {
  constructor(callback: (entries: { target: Element; isIntersecting: boolean }[]) => void) {
    report = (targets) => callback(targets.map((target) => ({ target, isIntersecting: true })));
  }
  observe = (el: Element) => void watched.push(el);
  unobserve = (el: Element) => void (watched = watched.filter((w) => w !== el));
  disconnect = () => void (watched = []);
}

/** A page with two block parts: one at the top of the window, one far below it. */
function page() {
  document.body.innerHTML = `<main><section id="a"><div><h2 id="top">Top</h2><p id="below">Below</p></div></section></main>`;
  const below = document.getElementById("below")!;
  below.getBoundingClientRect = () => ({ top: window.innerHeight + 500 }) as DOMRect;
  return { top: document.getElementById("top")!, below };
}

describe("Reveal", () => {
  beforeEach(() => {
    pathname = "/";
    watched = [];
    vi.stubGlobal("IntersectionObserver", FakeObserver);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("hides only parts below the window, and shows each when it comes into view", () => {
    const { top, below } = page();
    render(<Reveal />);
    expect(top.dataset.reveal).toBeUndefined();
    expect(below.dataset.reveal).toBe("hidden");
    expect(watched).toEqual([below]);

    act(() => report([below]));
    expect(below.dataset.reveal).toBe("shown");
    expect(watched).toEqual([]);
  });

  it("hides nothing in edit mode", () => {
    pathname = "/edit";
    const { below } = page();
    render(<Reveal />);
    expect(below.dataset.reveal).toBeUndefined();
  });

  it("leaves nothing hidden when it stops watching, and a new run hides it again", () => {
    const { below } = page();
    const { unmount } = render(<Reveal />);
    unmount();
    expect(below.dataset.reveal).toBeUndefined();
    render(<Reveal />);
    expect(below.dataset.reveal).toBe("hidden");
  });
});
