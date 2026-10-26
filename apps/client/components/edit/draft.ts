import type { Block } from "@/types/api";

/**
 * Edit mode (docs/FRONTEND.md "Edit mode"): helpers for the blocks the editor sends.
 * Pure functions, so they are tested without a browser.
 */

/** A block as the editor holds it: stored shape, unsaved, hidden ones too. */
export type DraftBlock = { id: string; type: string; title?: string | null; is_shown: boolean } & Record<string, unknown>;

/** Messages between the editor and this page. Both sides check the other's origin first. */
export type EditorMessage = {
  tcos: "edit";
  type: "load";
  blocks: DraftBlock[];
  selected: number | null;
  /** Block type → its name in the editor, for the toolbar. */
  labels: Record<string, string>;
};

export type CanvasMessage =
  | { tcos: "edit"; type: "ready" }
  | { tcos: "edit"; type: "select"; index: number }
  | { tcos: "edit"; type: "edit"; index: number; path: string; value: string }
  | { tcos: "edit"; type: "image"; index: number; path: string }
  | { tcos: "edit"; type: "fields"; index: number }
  | { tcos: "edit"; type: "move"; index: number; to: number }
  | { tcos: "edit"; type: "remove"; index: number }
  | { tcos: "edit"; type: "insert"; at: number };

/** The editor's "load" message, or null for anything else. */
export function readLoad(data: unknown): EditorMessage | null {
  if (!data || typeof data !== "object") return null;
  const m = data as Partial<EditorMessage>;
  if (m.tcos !== "edit" || m.type !== "load" || !Array.isArray(m.blocks)) return null;
  const blocks = m.blocks.filter(
    (b): b is DraftBlock => !!b && typeof b === "object" && typeof b.id === "string" && typeof b.type === "string",
  );
  return {
    tcos: "edit",
    type: "load",
    blocks,
    selected: typeof m.selected === "number" ? m.selected : null,
    labels: m.labels && typeof m.labels === "object" ? m.labels : {},
  };
}

// --- paths: "title", "items.2.desc" ------------------------------------------------

export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((at, key) => (at && typeof at === "object" ? (at as Record<string, unknown>)[key] : undefined), obj);
}

/** A copy of `obj` with `path` set; the lists and objects on the way are copied too. */
export function setPath<T>(obj: T, path: string, value: unknown): T {
  const [key, ...rest] = path.split(".");
  const copy = (Array.isArray(obj) ? [...obj] : { ...(obj as object) }) as Record<string, unknown>;
  copy[key] = rest.length ? setPath(copy[key] ?? {}, rest.join("."), value) : value;
  return copy as T;
}

// --- empty fields ------------------------------------------------------------------

/** Shows on an image field with no image: not a URL, so Media draws its empty frame. */
export const NO_IMAGE = "<image>";

/**
 * The fields of each content block that can be typed into on the page, with the word shown
 * while one is empty, so there is something to click. `*` is every item of a list.
 * Images (kind "image") show the empty frame instead.
 */
export const EMPTY_LABELS: Record<string, Record<string, string>> = {
  hero: { title: "Title", subtitle: "Subtitle", media_url: NO_IMAGE, "buttons.*.label": "Button" },
  article: { title: "Section heading", body: "Write the text here", image: NO_IMAGE },
  image: { title: "Section heading", url: NO_IMAGE, caption: "Caption", credit: "Credit" },
  quote: { title: "Section heading", text: "The quote", who: "Who said it", role: "Their role", background_image: NO_IMAGE },
  gallery: { title: "Section heading", "items.*.url": NO_IMAGE, "items.*.desc": "Description" },
  button: { title: "Section heading", "buttons.*.label": "Button" },
  video: { title: "Section heading", "videos.*.title": "Video title", "videos.*.caption": "Caption" },
};

/** The lists each content block's component reads without checking, so a new block does not break it. */
const LISTS: Record<string, string[]> = {
  hero: ["buttons", "slides"],
  gallery: ["items"],
  video: ["videos"],
  button: ["buttons"],
};

function expand(block: DraftBlock, pattern: string): string[] {
  const [list, , field] = pattern.split(".");
  if (!pattern.includes("*")) return [pattern];
  const items = getPath(block, list);
  return Array.isArray(items) ? items.map((_, i) => `${list}.${i}.${field}`) : [];
}

/**
 * The block ready to render in edit mode: missing lists as [], and every empty editable field
 * filled with its label, listed in `empty` so the page can show it as a hint, not as content.
 */
export function withEmptyLabels(block: DraftBlock): { block: DraftBlock; empty: Set<string> } {
  let out = block;
  for (const list of LISTS[block.type] ?? []) if (!Array.isArray(out[list])) out = setPath(out, list, []);
  const empty = new Set<string>();
  for (const [pattern, label] of Object.entries(EMPTY_LABELS[block.type] ?? {})) {
    for (const path of expand(out, pattern)) {
      const value = getPath(out, path);
      if (value === undefined || value === null || value === "") {
        out = setPath(out, path, label);
        empty.add(path);
      }
    }
  }
  return { block: out, empty };
}

// --- data blocks -------------------------------------------------------------------

const SETTINGS_IGNORED = new Set(["id", "type", "title", "is_shown"]);
const norm = (v: unknown) => JSON.stringify(v === undefined || (Array.isArray(v) && v.length === 0) ? null : v);

/**
 * A data block's saved, filled version (from the public API), when its settings are unchanged,
 * with the draft's heading. Null when there is none: the block is new, hidden, or its settings
 * changed since the last save.
 */
export function filledVersion(draft: DraftBlock, saved: readonly Block[]): Block | null {
  const match = saved.find((b) => b.id === draft.id && b.type === draft.type);
  if (!match) return null;
  for (const [key, value] of Object.entries(draft)) {
    if (!SETTINGS_IGNORED.has(key) && norm(value) !== norm((match as Record<string, unknown>)[key])) return null;
  }
  return { ...match, title: draft.title ?? null } as Block;
}
