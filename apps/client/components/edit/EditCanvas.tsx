"use client";

import {
  Component,
  type ComponentType,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { blockComponents } from "@/components/blocks";
import type { Block } from "@/types/api";
import { type CanvasMessage, type EditorMessage, filledVersion, getPath, readLoad, withEmptyLabels } from "./draft";

/** Content blocks are rendered from the draft; the others need the server's data. */
const CONTENT_TYPES = new Set(["hero", "article", "image", "quote", "gallery", "video", "button", "stats"]);

type Typing = { index: number; path: string; element: HTMLElement };
type Markdown = { index: number; path: string; value: string; top: number; left: number; width: number; height: number };

/** One block that throws while half-made shows a note; the rest of the page still renders. */
class BlockBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean; key: string }> {
  state = { failed: false, key: this.props.resetKey };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  static getDerivedStateFromProps(props: { resetKey: string }, state: { failed: boolean; key: string }) {
    return props.resetKey === state.key ? null : { failed: false, key: props.resetKey };
  }
  render() {
    return this.state.failed ? <Note>This block cannot be shown yet. Check its fields.</Note> : this.props.children;
  }
}

function Note({ children }: { children: ReactNode }) {
  return <p className="rounded-card border border-dashed border-border px-6 py-8 text-center text-muted">{children}</p>;
}

/**
 * The page in edit mode, inside the editor's frame. It renders the blocks the editor sends with
 * the site's own components, and sends back every change made on the page: typing into a marked
 * field (`data-field`), an image to pick, moving, removing and adding blocks. It keeps no data
 * of its own: the editor holds the blocks and saves them.
 */
export default function EditCanvas({
  editorOrigin,
  saved,
  header,
}: {
  editorOrigin: string;
  /** The page's shown blocks as last saved, filled in by the server, for data blocks. */
  saved: readonly Block[];
  /** The fixed header above a project's blocks. */
  header?: ReactNode;
}) {
  const [doc, setDoc] = useState<EditorMessage | null>(null);
  const [markdown, setMarkdown] = useState<Markdown | null>(null);
  // Typing in place changes the page outside React, so a block is drawn afresh once its typing ends.
  const [revisions, setRevisions] = useState<Record<number, number>>({});
  const typing = useRef<Typing | null>(null);
  const pending = useRef<EditorMessage | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const send = useCallback(
    (message: CanvasMessage) => window.parent.postMessage(message, editorOrigin),
    [editorOrigin],
  );

  // Blocks from the editor. While a field is being typed into, they wait: re-rendering it
  // would move the cursor. The editor already has those keystrokes.
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== editorOrigin || event.source !== window.parent) return;
      const load = readLoad(event.data);
      if (!load) return;
      if (typing.current) pending.current = load;
      else setDoc(load);
    }
    window.addEventListener("message", receive);
    send({ tcos: "edit", type: "ready" });
    return () => window.removeEventListener("message", receive);
  }, [editorOrigin, send]);

  // Links on the page do not leave edit mode: a click on a button's label types into it.
  useEffect(() => {
    const stay = (event: globalThis.MouseEvent) => {
      if ((event.target as Element | null)?.closest?.("a")) event.preventDefault();
    };
    document.addEventListener("click", stay, true);
    return () => document.removeEventListener("click", stay, true);
  }, []);

  // The block picked in the editor comes into view.
  const selected = doc?.selected ?? null;
  useEffect(() => {
    if (selected === null) return;
    root.current?.querySelector(`[data-block-index="${selected}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  const rendered = (doc?.blocks ?? []).map((block) => withEmptyLabels(block));

  // Fields still empty show their label as a hint.
  useLayoutEffect(() => {
    root.current?.querySelectorAll<HTMLElement>("[data-block-index]").forEach((section) => {
      const empty = rendered[Number(section.dataset.blockIndex)]?.empty;
      section.querySelectorAll<HTMLElement>("[data-field]").forEach((el) => {
        el.toggleAttribute("data-empty", !!empty?.has(el.dataset.field ?? ""));
      });
    });
  });

  function startTyping(element: HTMLElement, index: number, path: string) {
    if (typing.current?.element === element) return;
    element.contentEditable = "plaintext-only";
    element.focus();
    if (element.hasAttribute("data-empty")) document.getSelection()?.selectAllChildren(element);
    typing.current = { index, path, element };
    element.addEventListener(
      "blur",
      () => {
        element.contentEditable = "false";
        typing.current = null;
        setRevisions((r) => ({ ...r, [index]: (r[index] ?? 0) + 1 }));
        if (pending.current) {
          setDoc(pending.current);
          pending.current = null;
        }
      },
      { once: true },
    );
  }

  function onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const section = target.closest<HTMLElement>("[data-block-index]");
    if (!section || target.closest("[data-edit-chrome]")) return;
    const index = Number(section.dataset.blockIndex);
    // A background picture sits under the text and its dark layer: a click on empty space reaches it.
    const field =
      target.closest<HTMLElement>("[data-field]") ??
      document
        .elementsFromPoint(event.clientX, event.clientY)
        .find((el): el is HTMLElement => el.matches('[data-field-kind="image"]') && section.contains(el)) ??
      null;
    if (doc?.selected !== index) send({ tcos: "edit", type: "select", index });
    if (!field || !CONTENT_TYPES.has(doc?.blocks[index]?.type ?? "")) return;

    const path = field.dataset.field ?? "";
    const kind = field.dataset.fieldKind;
    if (kind === "image") {
      send({ tcos: "edit", type: "image", index, path });
    } else if (kind === "markdown") {
      const box = field.getBoundingClientRect();
      const current = getPath(doc?.blocks[index], path);
      setMarkdown({
        index,
        path,
        value: typeof current === "string" ? current : "",
        top: box.top + window.scrollY,
        left: box.left + window.scrollX,
        width: box.width,
        height: Math.max(box.height, 160),
      });
    } else {
      startTyping(field, index, path);
    }
  }

  function onInput(event: FormEvent) {
    const t = typing.current;
    if (!t || event.target !== t.element) return;
    t.element.removeAttribute("data-empty");
    send({ tcos: "edit", type: "edit", index: t.index, path: t.path, value: t.element.textContent ?? "" });
  }

  function onKeyDown(event: KeyboardEvent) {
    // Enter ends a one-line field instead of adding a line break.
    if (event.key === "Enter" && typing.current) {
      event.preventDefault();
      typing.current.element.blur();
    }
  }

  if (!doc) return <Note>Waiting for the editor…</Note>;

  const label = (type: string) => doc.labels[type] ?? type;
  const insert = (at: number) => (
    <div data-edit-chrome="" className="flex justify-center py-2">
      <button
        type="button"
        onClick={() => send({ tcos: "edit", type: "insert", at })}
        className="rounded-button border border-dashed border-border px-4 py-1 text-muted hover:border-accent hover:text-accent"
      >
        + Add a block here
      </button>
    </div>
  );

  return (
    <div ref={root} data-editing="" className="relative" onClick={onClick} onInput={onInput} onKeyDown={onKeyDown}>
      {header}
      {insert(0)}
      {rendered.map(({ block }, index) => {
        const draft = doc.blocks[index];
        const Shown = blockComponents[block.type as keyof typeof blockComponents] as ComponentType<{ block: Block }> | undefined;
        const data = CONTENT_TYPES.has(block.type) ? (block as unknown as Block) : filledVersion(draft, saved);
        const isSelected = doc.selected === index;
        return (
          <div key={`${draft.id}-${index}-${revisions[index] ?? 0}`}>
            <section
              id={draft.id}
              data-block-index={index}
              className={`group relative rounded-card outline-offset-4 ${
                isSelected ? "outline-2 outline-accent" : "hover:outline hover:outline-border"
              }`}
            >
              <div
                data-edit-chrome=""
                className={`absolute -top-3 right-2 z-20 items-center gap-1 rounded-button border border-border bg-background px-1 ${
                  isSelected ? "flex" : "hidden group-hover:flex"
                }`}
              >
                <span className="px-2 text-muted">
                  {label(block.type)}
                  {draft.is_shown ? "" : " (hidden)"}
                </span>
                <ChromeButton label="Move up" disabled={index === 0} onClick={() => send({ tcos: "edit", type: "move", index, to: index - 1 })}>
                  ↑
                </ChromeButton>
                <ChromeButton
                  label="Move down"
                  disabled={index === doc.blocks.length - 1}
                  onClick={() => send({ tcos: "edit", type: "move", index, to: index + 1 })}
                >
                  ↓
                </ChromeButton>
                <ChromeButton label="All fields" onClick={() => send({ tcos: "edit", type: "fields", index })}>
                  All fields
                </ChromeButton>
                <ChromeButton label="Remove" onClick={() => send({ tcos: "edit", type: "remove", index })}>
                  ✕
                </ChromeButton>
              </div>
              <div className={draft.is_shown ? "" : "opacity-50"}>
                {!Shown ? (
                  <Note>{label(block.type)}: the site does not show this kind of block yet.</Note>
                ) : !data ? (
                  <Note>{label(block.type)}: save, with the block shown, to see its data here.</Note>
                ) : (
                  <BlockBoundary resetKey={JSON.stringify(block)}>
                    <Shown block={data} />
                  </BlockBoundary>
                )}
              </div>
            </section>
            {insert(index + 1)}
          </div>
        );
      })}

      {markdown ? (
        <textarea
          data-edit-chrome=""
          autoFocus
          aria-label="Text, in Markdown"
          defaultValue={markdown.value}
          style={{ top: markdown.top, left: markdown.left, width: markdown.width, height: markdown.height }}
          className="absolute z-30 rounded-button border border-accent bg-background p-3 text-foreground"
          onInput={(e) =>
            send({ tcos: "edit", type: "edit", index: markdown.index, path: markdown.path, value: e.currentTarget.value })
          }
          onBlur={() => setMarkdown(null)}
        />
      ) : null}
    </div>
  );
}

function ChromeButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-button px-2 py-1 text-muted hover:text-foreground disabled:opacity-40"
    >
      {children}
    </button>
  );
}
