"use client";

import { type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { saveBlocks } from "@/app/actions";
import { AddBlockDialog, ImageDialog } from "@/components/BlockDialogs";
import FieldInput from "@/components/FieldInput";
import { SaveStatus, ShownMark } from "@/components/ui";
import type { UploadOwner } from "@/lib/admin-api";
import { blockInfo, getPath, isPageField, moveItem, newBlock, ON_SITE, pageValue, setField, setPath } from "@/lib/blocks";
import { canvasMessageSchema, isFromPage } from "@/lib/canvas";
import { BLOCK_TYPES } from "@/lib/schemas";
import type { ActionResult, Block, BlocksTarget, BlockType } from "@/types/admin";

type Row = { key: string; block: Block };

/** Rows with keys stable while ids change and rows move; a new `generation` starts fresh keys. */
const rowsOf = (blocks: Block[], generation: number): Row[] =>
  blocks.map((block, i) => ({ key: `${generation}-${i}`, block }));

/** Block type → its name, for the page's toolbar. */
const LABELS = Object.fromEntries(BLOCK_TYPES.map((t) => [t, blockInfo[t].label]));

/** Image fields that may be left empty: the dialog offers "No image" for these. */
const NULLABLE_IMAGES = new Set(["image", "background_image"]);

/**
 * Edits a page's whole `blocks` array on the page itself: the client's edit mode, framed beside a
 * panel (docs/EDITOR.md "Editing on the page"). Text is typed in place, images are picked in a
 * dialog, and blocks are added, moved and removed on the page or in the panel's outline. The panel
 * also shows every field of the selected block. Nothing is sent until Save; a save sends the whole array.
 */
export default function BlocksEditor({
  target,
  initialBlocks,
  projectSlugs,
  canvasUrl,
  settings,
}: {
  target: BlocksTarget;
  initialBlocks: Block[];
  projectSlugs: string[];
  /** The client's edit mode for this page; null without SITE_URL, and then only the panel edits. */
  canvasUrl: string | null;
  /** The page's or project's own fields, shown in the panel while no block is selected. */
  settings: ReactNode;
}) {
  const initialJson = JSON.stringify(initialBlocks);
  const [generation, setGeneration] = useState(0);
  const [rows, setRows] = useState<Row[]>(() => rowsOf(initialBlocks, 0));
  const nextKey = useRef(0);
  /** The blocks as last saved or loaded: unsaved changes are anything else. */
  const [saved, setSaved] = useState(initialJson);
  const [seen, setSeen] = useState(initialJson);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [adding, setAdding] = useState<number | null>(null);
  const [picking, setPicking] = useState<{ key: string; path: string } | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const panel = useRef<HTMLElement>(null);

  // New data from the server replaces the rows, unless it is this editor's own last save.
  // Pages stay mounted in the background between visits (cacheComponents), so without
  // this a later save could send blocks older than a change made elsewhere, such as a
  // slug rename that rewrote a project_slug here.
  if (initialJson !== seen) {
    setSeen(initialJson);
    if (initialJson !== saved) {
      setGeneration(generation + 1);
      setRows(rowsOf(initialBlocks, generation + 1));
      setSaved(initialJson);
      setResult(null);
      setSelectedKey(null);
    }
  }
  const [pending, startTransition] = useTransition();
  const slugListId = useId();
  const uploadTo: UploadOwner =
    target.kind === "page" ? { collection: "pages", owner: target.key } : { collection: "projects", owner: target.slug };

  const blocks = useMemo(() => rows.map((r) => r.block), [rows]);
  const dirty = JSON.stringify(blocks) !== saved;
  const selectedIndex = rows.findIndex((r) => r.key === selectedKey);
  const selected = selectedIndex >= 0 ? rows[selectedIndex] : null;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (key: string, block: Block) => setRows((rs) => rs.map((r) => (r.key === key ? { key, block } : r)));
  const move = (index: number, to: number) => setRows((rs) => moveItem(rs, index, to));

  function insert(at: number, type: BlockType) {
    const key = `new-${nextKey.current++}`;
    const block = newBlock(type, blocks.map((b) => b.id));
    setRows((rs) => [...rs.slice(0, at), { key, block }, ...rs.slice(at)]);
    setSelectedKey(key);
    setAdding(null);
  }

  function remove(index: number) {
    const block = rows[index]?.block;
    if (!block || !window.confirm(`Remove the block "${block.id}" (${blockInfo[block.type].label})?`)) return;
    setRows((rs) => rs.filter((_, i) => i !== index));
  }

  function save() {
    const sent = JSON.stringify(blocks);
    startTransition(async () => {
      const answer = await saveBlocks(target, blocks);
      setResult(answer);
      if (answer.ok) setSaved(sent);
    });
  }

  function discard() {
    if (!window.confirm("Discard every change since the last save?")) return;
    setGeneration(generation + 1);
    setRows(rowsOf(JSON.parse(saved) as Block[], generation + 1));
    setSelectedKey(null);
    setResult(null);
  }

  // --- the page in the frame ---------------------------------------------------------

  const siteOrigin = canvasUrl ? new URL(canvasUrl).origin : null;

  const sendToPage = useCallback(() => {
    if (!siteOrigin) return;
    frame.current?.contentWindow?.postMessage(
      { tcos: "edit", type: "load", blocks, selected: selectedIndex >= 0 ? selectedIndex : null, labels: LABELS },
      siteOrigin,
    );
  }, [blocks, selectedIndex, siteOrigin]);

  useEffect(sendToPage, [sendToPage]);

  // What the page asks for. It runs on another origin, so each message is checked first.
  function onPageMessage(data: unknown) {
    const parsed = canvasMessageSchema.safeParse(data);
    if (!parsed.success) return;
    const m = parsed.data;
    if (m.type === "ready") return sendToPage();
    if (m.type === "insert") return setAdding(Math.min(m.at, rows.length));
    const row = rows[m.index];
    if (!row) return;
    switch (m.type) {
      case "select":
        return setSelectedKey(row.key);
      case "fields":
        setSelectedKey(row.key);
        return panel.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      case "move":
        return move(m.index, m.to);
      case "remove":
        return remove(m.index);
      case "edit":
        if (!isPageField(row.block.type, m.path, "text")) return;
        return update(row.key, setPath(row.block, m.path, pageValue(row.block.type, m.path, m.value)));
      case "image":
        if (!isPageField(row.block.type, m.path, "images")) return;
        setSelectedKey(row.key);
        return setPicking({ key: row.key, path: m.path });
    }
  }
  const handle = useRef<(data: unknown) => void>(() => {});
  useEffect(() => {
    handle.current = onPageMessage;
  });

  useEffect(() => {
    if (!siteOrigin) return;
    const receive = (event: MessageEvent) => {
      if (isFromPage(event, siteOrigin, frame.current?.contentWindow)) handle.current(event.data);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [siteOrigin]);

  const pickingRow = picking ? rows.find((r) => r.key === picking.key) : undefined;
  const pickingValue = pickingRow && picking ? getPath(pickingRow.block, picking.path) : undefined;

  return (
    <section aria-label="Blocks" className="flex flex-col gap-4">
      <datalist id={slugListId}>
        {projectSlugs.map((slug) => (
          <option key={slug} value={slug} />
        ))}
      </datalist>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-20">
          {canvasUrl ? (
            <>
              <iframe
                ref={frame}
                src={canvasUrl}
                title="The page, editable"
                className="h-[75vh] w-full rounded-[var(--radius-card)] border border-border bg-background lg:h-[calc(100vh-10rem)]"
              />
              <p className="text-muted">
                Click text to type, or a picture to change it. Point at a block for its buttons. Changes stay here until
                you save.
              </p>
            </>
          ) : (
            <p className="border-l-2 border-border pl-3 text-muted">
              Set SITE_URL to edit on the page itself. Until then, pick a block in the list to edit its fields.
            </p>
          )}
        </div>

        <aside ref={panel} className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          <nav aria-label="Blocks on this page" className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <h2>Blocks</h2>
              <button type="button" className="btn" onClick={() => setAdding(rows.length)}>
                Add a block
              </button>
            </div>
            {rows.length === 0 ? <p className="text-muted">No blocks yet. Add the first one.</p> : null}
            <ol className="flex flex-col">
              {rows.map(({ key, block }, index) => (
                <li key={key}>
                  <button
                    type="button"
                    aria-current={key === selectedKey ? "true" : undefined}
                    onClick={() => setSelectedKey(key === selectedKey ? null : key)}
                    className={`flex w-full items-baseline gap-3 rounded-[var(--radius-button)] px-2 py-1.5 text-left hover:bg-card-bg ${
                      key === selectedKey ? "bg-card-bg" : ""
                    }`}
                  >
                    <span className="w-5 text-right text-muted tabular-nums">{index + 1}</span>
                    <span className={`min-w-0 flex-1 truncate ${block.is_shown ? "" : "text-muted"}`}>
                      {blockInfo[block.type].label}
                      {block.title ? <span className="ml-2 text-muted">{block.title}</span> : null}
                    </span>
                    <ShownMark shown={block.is_shown} />
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          {selected ? (
            <BlockPanel
              key={selected.key}
              row={selected}
              index={selectedIndex}
              count={rows.length}
              slugListId={slugListId}
              uploadTo={uploadTo}
              onChange={(block) => update(selected.key, block)}
              onMove={(to) => move(selectedIndex, to)}
              onRemove={() => remove(selectedIndex)}
              onClose={() => setSelectedKey(null)}
            />
          ) : (
            settings
          )}
        </aside>
      </div>

      <div className="bar sticky bottom-4 z-10 flex flex-wrap items-center gap-3 px-3 py-2.5">
        <button type="button" className="btn btn-primary" disabled={!dirty || pending} onClick={save}>
          {pending ? "Saving…" : "Save blocks"}
        </button>
        <button type="button" className="btn" disabled={!dirty || pending} onClick={discard}>
          Discard changes
        </button>
        <span role="status" className={dirty ? "text-foreground" : result?.ok ? "text-green" : "text-muted"}>
          {dirty ? "Unsaved changes" : result?.ok ? result.message : "Everything is saved"}
        </span>
        {result && !result.ok ? (
          <div className="w-full">
            <SaveStatus result={result} />
          </div>
        ) : null}
      </div>

      {adding !== null ? <AddBlockDialog onPick={(type) => insert(adding, type)} onClose={() => setAdding(null)} /> : null}
      {picking && pickingRow ? (
        <ImageDialog
          current={typeof pickingValue === "string" ? pickingValue : ""}
          uploadTo={uploadTo}
          canRemove={NULLABLE_IMAGES.has(picking.path)}
          onPick={(url) => {
            update(pickingRow.key, setPath(pickingRow.block, picking.path, url));
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      ) : null}
    </section>
  );
}

/** Every field of the selected block, with its move, remove and shown controls. */
function BlockPanel({
  row: { key, block },
  index,
  count,
  slugListId,
  uploadTo,
  onChange,
  onMove,
  onRemove,
  onClose,
}: {
  row: Row;
  index: number;
  count: number;
  slugListId: string;
  uploadTo: UploadOwner;
  onChange: (block: Block) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const info = blockInfo[block.type];
  const idPrefix = `b${key}`;
  return (
    <section aria-label={`${info.label} block, all fields`} className="spotlight flex flex-col gap-5 rounded-[var(--radius-card)] border border-border p-4">
      <div className="flex items-start gap-2">
        <div className="mr-auto flex flex-col">
          <h2>{info.label}</h2>
          <p className="text-muted">
            {info.description}
            {info.kind === "data" ? ". Its items are edited where they are stored, not here." : "."}
            {ON_SITE.has(block.type) ? "" : " The site does not show this kind of block yet."}
          </p>
        </div>
        <button type="button" className="btn-icon" aria-label="Move up" title="Move up" disabled={index === 0} onClick={() => onMove(index - 1)}>
          ↑
        </button>
        <button
          type="button"
          className="btn-icon"
          aria-label="Move down"
          title="Move down"
          disabled={index === count - 1}
          onClick={() => onMove(index + 1)}
        >
          ↓
        </button>
        <button type="button" className="btn-icon" aria-label="Remove" title="Remove" onClick={onRemove}>
          ✕
        </button>
        <button type="button" className="btn" onClick={onClose}>
          Done
        </button>
      </div>

      <FieldInput
        spec={{ kind: "bool", key: "is_shown", label: "Shown on the site", hint: "Off: saved, but left off the page" }}
        value={block}
        idPrefix={idPrefix}
        onChange={(next) => onChange(setField(block, "is_shown", next.is_shown === true))}
      />
      <FieldInput
        spec={{ kind: "text", key: "title", label: "Section heading", nullable: true }}
        value={block}
        idPrefix={idPrefix}
        onChange={(next) => onChange(next as Block)}
      />
      {info.fields.map((field) => (
        <FieldInput
          key={field.key}
          spec={field}
          value={block}
          idPrefix={idPrefix}
          projectSlugsListId={slugListId}
          uploadTo={uploadTo}
          onChange={(next) => onChange(next as Block)}
        />
      ))}
      <FieldInput
        spec={{ kind: "text", key: "id", label: "Block id", required: true, hint: "Unique on the page; also its #anchor in links" }}
        value={block}
        idPrefix={idPrefix}
        onChange={(next) => onChange(next as Block)}
      />
    </section>
  );
}
