"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import UploadButton from "@/components/UploadButton";
import type { UploadOwner } from "@/lib/admin-api";
import { blockInfo, ON_SITE } from "@/lib/blocks";
import { BLOCK_TYPES } from "@/lib/schemas";
import type { BlockType } from "@/types/admin";

/** A modal <dialog>, open while mounted; Escape or the close button calls `onClose`. */
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-border bg-card-bg p-0 text-foreground backdrop:bg-background/70"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2>{title}</h2>
          <button type="button" className="btn-icon" aria-label="Close" title="Close" onClick={() => ref.current?.close()}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

/** Picks the type of a new block. */
export function AddBlockDialog({ onPick, onClose }: { onPick: (type: BlockType) => void; onClose: () => void }) {
  const group = (kind: "content" | "data", heading: string) => (
    <section className="flex flex-col gap-1">
      <h3 className="text-muted">{heading}</h3>
      <ul className="flex flex-col">
        {BLOCK_TYPES.filter((t) => blockInfo[t].kind === kind).map((type) => (
          <li key={type}>
            <button
              type="button"
              onClick={() => onPick(type)}
              className="flex w-full flex-col rounded-[var(--radius-button)] px-3 py-2 text-left hover:bg-background"
            >
              <span className="font-heading font-semibold">
                {blockInfo[type].label}
                {ON_SITE.has(type) ? "" : <span className="font-body font-normal text-muted"> (not on the site yet)</span>}
              </span>
              <span className="text-muted">{blockInfo[type].description}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <Dialog title="Add a block" onClose={onClose}>
      <p className="text-muted">It starts hidden, so the site does not show it half-made.</p>
      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
        {group("content", "Text and pictures")}
        {group("data", "Filled in from the site's data")}
      </div>
    </Dialog>
  );
}

/** Replaces one image: an upload, a URL, or (when the field allows) no image. */
export function ImageDialog({
  current,
  uploadTo,
  canRemove,
  onPick,
  onClose,
}: {
  current: string;
  uploadTo: UploadOwner;
  canRemove: boolean;
  onPick: (url: string | null) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(current);
  return (
    <Dialog title="Image" onClose={onClose}>
      <UploadButton to={uploadTo} onUploaded={onPick} />
      <form
        className="flex flex-col gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          onPick(url.trim());
        }}
      >
        <label htmlFor="image-dialog-url" className="font-bold">
          Or an image URL
        </label>
        <div className="flex gap-2">
          <input id="image-dialog-url" type="text" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="submit" className="btn" disabled={url.trim() === "" || url.trim() === current}>
            Use it
          </button>
        </div>
      </form>
      {canRemove ? (
        <div>
          <button type="button" className="btn" onClick={() => onPick(null)}>
            No image
          </button>
        </div>
      ) : null}
    </Dialog>
  );
}
