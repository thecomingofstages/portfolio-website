"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { saveBlocks } from "@/app/actions";
import { AddBlockDialog, MediaDialog } from "@/components/BlockDialogs";
import FieldInput from "@/components/FieldInput";
import { useSaveable } from "@/components/SaveGroup";
import { SaveStatus, ShownMark, Switch } from "@/components/ui";
import type { UploadOwner } from "@/lib/admin-api";
import { blockInfo, getPath, hasHomeBanner, isAlwaysShown, isPageField, moveItem, newBlock, ON_SITE, pageValue, setField, setPath } from "@/lib/blocks";
import { canvasMessageSchema, isFromPage } from "@/lib/canvas";
import { BLOCK_TYPES } from "@/lib/schemas";
import type { ActionResult, Block, BlocksTarget, BlockType } from "@/types/admin";

type Row = { key: string; block: Block };

/** Rows with keys stable while ids change and rows move; a new `generation` starts fresh keys. */
const rowsOf = (blocks: Block[], generation: number): Row[] =>
  blocks.map((block, i) => ({ key: `${generation}-${i}`, block }));

/** Block type → its name, for the page's toolbar. */
const LABELS = Object.fromEntries(BLOCK_TYPES.map((t) => [t, blockInfo[t].label]));

/** A project's header on the page in the frame: its unsaved fields, as ProjectHeader reads them. */
export type PreviewProject = { name: string; start_date: string; end_date: string | null; venue: string | null; pics: string[] };

const PreviewContext = createContext<((project: PreviewProject | null) => void) | null>(null);

/** Shows a project's unsaved header fields on the page in the frame (from the panel's settings). */
export function usePreviewProject(project: PreviewProject | null) {
  const set = useContext(PreviewContext);
  const json = JSON.stringify(project);
  useEffect(() => set?.(JSON.parse(json) as PreviewProject | null), [set, json]);
}

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
  /** Whether the framed page has said it is ready, and whether it has been quiet too long. */
  const [pageReady, setPageReady] = useState(false);
  const [pageSilent, setPageSilent] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const [previewProject, setPreviewProject] = useState<PreviewProject | null>(null);

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
  const slugListId = useId();
  const uploadTo: UploadOwner =
    target.kind === "page" ? { collection: "pages", owner: target.key } : { collection: "projects", owner: target.slug };

  const hideable = !(target.kind === "page" && isAlwaysShown(target.key));
  const blocks = useMemo(() => rows.map((r) => r.block), [rows]);
  const dirty = JSON.stringify(blocks) !== saved;
  const selectedIndex = rows.findIndex((r) => r.key === selectedKey);
  const selected = selectedIndex >= 0 ? rows[selectedIndex] : null;

  const update = (key: string, block: Block) => setRows((rs) => rs.map((r) => (r.key === key ? { key, block } : r)));
  const pinned = target.kind === "page" && hasHomeBanner(target.key, blocks);
  const canMove = (index: number, to: number) => to >= 0 && to < rows.length && !(pinned && (index === 0 || to === 0));
  const move = (index: number, to: number) => {
    if (canMove(index, to)) setRows((rs) => moveItem(rs, index, to));
  };

  function insert(at: number, type: BlockType) {
    if (pinned) at = Math.max(at, 1);
    const key = `new-${nextKey.current++}`;
    const block = newBlock(type, !hideable);
    setRows((rs) => [...rs.slice(0, at), { key, block }, ...rs.slice(at)]);
    setSelectedKey(key);
    setAdding(null);
  }

  function remove(index: number) {
    if (pinned && index === 0) return;
    const block = rows[index]?.block;
    if (!block || !window.confirm(`Remove the block ${blockInfo[block.type].label}${block.title ? ` "${block.title}"` : ""}?`)) return;
    setRows((rs) => rs.filter((_, i) => i !== index));
  }

  // Saved and discarded with the rest of the page, from the header (SaveGroup).
  useSaveable("blocks", {
    dirty,
    order: 1,
    save: async () => {
      const sent = JSON.stringify(blocks);
      const answer = await saveBlocks(target, blocks);
      setResult(answer);
      if (answer.ok) setSaved(sent);
      return answer.ok;
    },
    discard: () => {
      setGeneration(generation + 1);
      setRows(rowsOf(JSON.parse(saved) as Block[], generation + 1));
      setSelectedKey(null);
      setResult(null);
    },
  });

  // --- the page in the frame ---------------------------------------------------------

  const siteOrigin = canvasUrl ? new URL(canvasUrl).origin : null;

  const sendToPage = useCallback(() => {
    if (!siteOrigin) return;
    frame.current?.contentWindow?.postMessage(
      { tcos: "edit", type: "load", blocks, selected: selectedIndex >= 0 ? selectedIndex : null, labels: LABELS },
      siteOrigin,
    );
  }, [blocks, selectedIndex, siteOrigin]);

  // The project's header goes on its own, so typing in it does not redraw every block.
  const sendProject = useCallback(() => {
    if (!siteOrigin || !previewProject) return;
    frame.current?.contentWindow?.postMessage({ tcos: "edit", type: "project", project: previewProject }, siteOrigin);
  }, [previewProject, siteOrigin]);

  useEffect(sendToPage, [sendToPage]);
  useEffect(sendProject, [sendProject]);

  // What the page asks for. It runs on another origin, so each message is checked first.
  function onPageMessage(data: unknown) {
    const parsed = canvasMessageSchema.safeParse(data);
    if (!parsed.success) return;
    const m = parsed.data;
    if (m.type === "ready") {
      setPageReady(true);
      sendProject();
      return sendToPage();
    }
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

  // A page that never answers (the site is down, or its EDITOR_ORIGIN is not this editor) gets a hint.
  useEffect(() => {
    if (!siteOrigin) return;
    const timer = setTimeout(() => setPageSilent(true), 20_000);
    return () => clearTimeout(timer);
  }, [siteOrigin]);

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
              <div className="relative">
                <iframe
                  ref={frame}
                  src={canvasUrl}
                  title="The page, editable"
                  className="block h-[75vh] w-full rounded-[var(--radius-card)] border border-border bg-background lg:h-[calc(100vh-10rem)]"
                />
                {pageReady ? null : (
                  <div
                    role="status"
                    className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-card)] border border-border bg-background p-6 text-center"
                  >
                    {pageSilent ? (
                      <p className="max-w-sm text-muted">
                        หน้าเว็บไม่ตอบกลับ ลองเช็กว่าเว็บเปิดอยู่ที่ {siteOrigin} และตั้ง EDITOR_ORIGIN เป็นที่อยู่ของ
                        editor นี้แล้ว ระหว่างนี้แก้บล็อกจากรายการไปก่อนได้
                      </p>
                    ) : (
                      <p className="text-muted">กำลังโหลดหน้าเว็บ…</p>
                    )}
                  </div>
                )}
              </div>
              <p className="text-muted">
                คลิกที่ข้อความเพื่อพิมพ์ หรือคลิกที่รูปเพื่อเปลี่ยนรูป ชี้ที่บล็อกเพื่อดูปุ่มของบล็อกนั้น ที่แก้ไว้จะยังไม่ขึ้นเว็บจนกว่าจะกด
                Save
              </p>
            </>
          ) : (
            <p className="border-l-2 border-border pl-3 text-muted">
              ตั้งค่า SITE_URL ก่อน ถึงจะแก้บนหน้าเว็บได้ ระหว่างนี้เลือกบล็อกจากรายการเพื่อแก้ทีละช่อง
            </p>
          )}
        </div>

        <aside ref={panel} className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          {result && !result.ok ? <SaveStatus result={result} /> : null}
          <nav aria-label="Blocks on this page" className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <h2>Blocks</h2>
              <button type="button" className="btn" onClick={() => setAdding(rows.length)}>
                Add a block
              </button>
            </div>
            {rows.length === 0 ? <p className="text-muted">ยังไม่มีบล็อก เพิ่มบล็อกแรกได้เลย</p> : null}
            <ol className="flex flex-col gap-1">
              {rows.map(({ key, block }, index) => (
                <li key={key}>
                  <button
                    type="button"
                    aria-current={key === selectedKey ? "true" : undefined}
                    onClick={() => setSelectedKey(key === selectedKey ? null : key)}
                    className={`flex w-full items-baseline gap-3 rounded-[var(--radius-button)] border border-border px-2 py-1.5 text-left hover:bg-card-bg ${
                      key === selectedKey ? "bg-card-bg" : ""
                    }`}
                  >
                    <span className="w-5 text-right text-muted tabular-nums">{index + 1}</span>
                    <span className={`min-w-0 flex-1 truncate ${block.is_shown ? "" : "text-muted"}`}>
                      {blockInfo[block.type].label}
                      {block.title ? <span className="ml-2 text-muted">{block.title}</span> : null}
                    </span>
                    {/* On home, only a block hidden before the switch went away is marked. */}
                    {hideable || !block.is_shown ? <ShownMark shown={block.is_shown} /> : null}
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
              hideable={hideable}
              canMoveTo={(to) => canMove(selectedIndex, to)}
              removable={!(pinned && selectedIndex === 0)}
              slugListId={slugListId}
              uploadTo={uploadTo}
              onChange={(block) => update(selected.key, block)}
              onMove={(to) => move(selectedIndex, to)}
              onRemove={() => remove(selectedIndex)}
              onClose={() => setSelectedKey(null)}
            />
          ) : null}
          {/* Hidden, not removed, while a block is selected: its unsaved changes must survive. */}
          <div hidden={!!selected}>
            <PreviewContext.Provider value={setPreviewProject}>{settings}</PreviewContext.Provider>
          </div>
        </aside>
      </div>

      {adding !== null ? <AddBlockDialog onPick={(type) => insert(adding, type)} onClose={() => setAdding(null)} /> : null}
      {picking && pickingRow ? (
        <MediaDialog
          current={typeof pickingValue === "string" ? pickingValue : ""}
          uploadTo={uploadTo}
          video={pickingRow.block.type === "hero" && picking.path === "media_url" && pickingRow.block.media_kind === "video"}
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
  hideable,
  canMoveTo,
  removable,
  slugListId,
  uploadTo,
  onChange,
  onMove,
  onRemove,
  onClose,
}: {
  row: Row;
  index: number;
  /** Whether the block has a "Shown on the site" switch (not on the home page). */
  hideable: boolean;
  canMoveTo: (to: number) => boolean;
  /** False for the home banner, which stays. */
  removable: boolean;
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
      {hideable ? (
        <Switch
          id={`${idPrefix}-is_shown`}
          checked={block.is_shown}
          label="Shown on the site"
          hint="ถ้าปิด บล็อกยังถูกบันทึกไว้ แต่จะไม่แสดงบนหน้าเว็บ"
          onChange={(shown) => onChange(setField(block, "is_shown", shown))}
        />
      ) : null}
      <div className="flex items-start gap-2">
        <div className="mr-auto flex flex-col">
          <h2>{info.label}</h2>
          <p className="text-muted">
            {[
              info.description,
              info.kind === "data" ? "ข้อมูลในบล็อกนี้ต้องไปแก้ที่ต้นทาง" : null,
              ON_SITE.has(block.type) ? null : "ตอนนี้เว็บยังไม่แสดงบล็อกแบบนี้",
            ]
              .filter(Boolean)
              .join(" ")}
          </p>
        </div>
        <button type="button" className="btn-icon" aria-label="Move up" title="Move up" disabled={!canMoveTo(index - 1)} onClick={() => onMove(index - 1)}>
          ↑
        </button>
        <button
          type="button"
          className="btn-icon"
          aria-label="Move down"
          title="Move down"
          disabled={!canMoveTo(index + 1)}
          onClick={() => onMove(index + 1)}
        >
          ↓
        </button>
        {removable ? (
          <button type="button" className="btn-icon" aria-label="Remove" title="Remove" onClick={onRemove}>
            ✕
          </button>
        ) : null}
        <button type="button" className="btn" onClick={onClose}>
          Done
        </button>
      </div>

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
    </section>
  );
}
