"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { saveBlocks } from "@/app/actions";
import FieldInput from "@/components/FieldInput";
import { SaveStatus, ShownBadge } from "@/components/ui";
import { blockInfo, moveItem, newBlock, setField } from "@/lib/blocks";
import { BLOCK_TYPES } from "@/lib/schemas";
import type { ActionResult, Block, BlocksTarget, BlockType } from "@/types/admin";

type Row = { key: string; block: Block };

/** Rows with keys stable while ids change and rows move; a new `generation` starts fresh keys. */
const rowsOf = (blocks: Block[], generation: number): Row[] =>
  blocks.map((block, i) => ({ key: `${generation}-${i}`, block }));

const CONTENT_TYPES = BLOCK_TYPES.filter((t) => blockInfo[t].kind === "content");
const DATA_TYPES = BLOCK_TYPES.filter((t) => blockInfo[t].kind === "data");

/**
 * Edits a page's whole `blocks` array: add, remove, reorder, hide, rename, and
 * each block's fields. Nothing is sent until Save; a save sends the whole array.
 */
export default function BlocksEditor({
  target,
  initialBlocks,
  projectSlugs,
}: {
  target: BlocksTarget;
  initialBlocks: Block[];
  projectSlugs: string[];
}) {
  const initialJson = JSON.stringify(initialBlocks);
  const [generation, setGeneration] = useState(0);
  const [rows, setRows] = useState<Row[]>(() => rowsOf(initialBlocks, 0));
  const nextKey = useRef(0);
  /** The blocks as last saved or loaded: unsaved changes are anything else. */
  const [saved, setSaved] = useState(initialJson);
  const [seen, setSeen] = useState(initialJson);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [addType, setAddType] = useState<BlockType>("article");
  const [openKey, setOpenKey] = useState<string | null>(null);

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
    }
  }
  const [pending, startTransition] = useTransition();
  const slugListId = useId();

  const blocks = useMemo(() => rows.map((r) => r.block), [rows]);
  const dirty = JSON.stringify(blocks) !== saved;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (key: string, block: Block) => setRows((rs) => rs.map((r) => (r.key === key ? { key, block } : r)));
  const move = (index: number, to: number) => setRows((rs) => moveItem(rs, index, to));

  function add() {
    const block = newBlock(addType, blocks.map((b) => b.id));
    const key = `new-${nextKey.current++}`;
    setRows((rs) => [...rs, { key, block }]);
    setOpenKey(key);
  }

  function remove(index: number) {
    const block = rows[index].block;
    if (!window.confirm(`Remove the block "${block.id}" (${blockInfo[block.type].label})?`)) return;
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
    setResult(null);
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby={`${slugListId}-heading`}>
      <datalist id={slugListId}>
        {projectSlugs.map((slug) => (
          <option key={slug} value={slug} />
        ))}
      </datalist>

      <div className="flex flex-wrap items-center gap-3">
        <h2 id={`${slugListId}-heading`}>Blocks</h2>
        <span className="text-muted">{rows.length} in page order</span>
      </div>

      {rows.length === 0 ? <p className="text-muted">No blocks yet. Add one below.</p> : null}

      <ol className="flex flex-col gap-3">
        {rows.map(({ key, block }, index) => {
          const info = blockInfo[block.type];
          const idPrefix = `b${key}`;
          return (
            <li key={key} className="rounded-[var(--radius-card)] border border-border bg-card-bg">
              <details open={openKey === key ? true : undefined}>
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                  <span className="text-muted">{index + 1}.</span>
                  <span className="font-heading font-semibold">{info.label}</span>
                  <span className="text-muted">#{block.id || "(no id)"}</span>
                  {block.title ? <span className="truncate">{block.title}</span> : null}
                  <span className="ml-auto">
                    <ShownBadge shown={block.is_shown} />
                  </span>
                </summary>

                <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
                  <p className="text-muted">
                    {info.description}
                    {info.kind === "data" ? ". Its items are edited where they are stored, not here." : "."}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn" disabled={index === 0} onClick={() => move(index, index - 1)}>
                      ↑ Up
                    </button>
                    <button
                      type="button"
                      className="btn"
                      disabled={index === rows.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      ↓ Down
                    </button>
                    <button type="button" className="btn" onClick={() => remove(index)}>
                      Remove
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldInput
                      spec={{ kind: "text", key: "id", label: "Block id", required: true, hint: "Unique on the page; also its #anchor" }}
                      value={block}
                      idPrefix={idPrefix}
                      onChange={(next) => update(key, next as Block)}
                    />
                    <FieldInput
                      spec={{ kind: "text", key: "title", label: "Section heading", nullable: true }}
                      value={block}
                      idPrefix={idPrefix}
                      onChange={(next) => update(key, next as Block)}
                    />
                  </div>
                  <FieldInput
                    spec={{ kind: "bool", key: "is_shown", label: "Shown on the site" }}
                    value={block}
                    idPrefix={idPrefix}
                    onChange={(next) => update(key, setField(block, "is_shown", next.is_shown === true))}
                  />

                  {info.fields.map((field) => (
                    <FieldInput
                      key={field.key}
                      spec={field}
                      value={block}
                      idPrefix={idPrefix}
                      projectSlugsListId={slugListId}
                      onChange={(next) => update(key, next as Block)}
                    />
                  ))}
                </div>
              </details>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-end gap-2 rounded-[var(--radius-card)] border border-dashed border-border p-3">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor={`${slugListId}-add`} className="font-heading font-semibold">
            New block
          </label>
          <select id={`${slugListId}-add`} value={addType} onChange={(e) => setAddType(e.target.value as BlockType)}>
            <optgroup label="Content">
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {blockInfo[t].label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Data">
              {DATA_TYPES.map((t) => (
                <option key={t} value={t}>
                  {blockInfo[t].label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <button type="button" className="btn" onClick={add}>
          Add block
        </button>
        <span className="text-muted">New blocks start hidden.</span>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-border bg-background py-3">
        <button type="button" className="btn btn-primary" disabled={!dirty || pending} onClick={save}>
          {pending ? "Saving…" : "Save blocks"}
        </button>
        <button type="button" className="btn" disabled={!dirty || pending} onClick={discard}>
          Discard changes
        </button>
        <span className="text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</span>
      </div>
      <SaveStatus result={result} />
    </section>
  );
}
