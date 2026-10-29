"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import BlockSketch from "@/components/BlockSketch";
import { OffSiteImageError } from "@/components/ui";
import UploadButton from "@/components/UploadButton";
import type { UploadOwner } from "@/lib/admin-api";
import { blockInfo, ON_SITE } from "@/lib/blocks";
import { isAllowedImage } from "@/lib/media";
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
      className="m-auto w-[min(42rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-border bg-card-bg p-0 text-foreground backdrop:bg-background/70"
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

/** Picks the type of a new block: a sketch of each. Only types the site shows (ON_SITE) are offered. */
export function AddBlockDialog({ onPick, onClose }: { onPick: (type: BlockType) => void; onClose: () => void }) {
  const group = (kind: "content" | "data", heading: string) => (
    <section className="flex flex-col gap-1">
      <h3 className="px-3 text-muted">{heading}</h3>
      <ul className="flex flex-col">
        {BLOCK_TYPES.filter((t) => blockInfo[t].kind === kind && ON_SITE.has(t)).map((type) => (
          <li key={type}>
            <button
              type="button"
              onClick={() => onPick(type)}
              className="flex w-full flex-col items-start gap-3 rounded-[var(--radius-button)] px-3 py-3 text-left hover:bg-background focus-visible:bg-background sm:flex-row sm:gap-4"
            >
              <BlockSketch type={type} />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-heading font-semibold">{blockInfo[type].label}</span>
                <span className="text-muted">{blockInfo[type].description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <Dialog title="Add a block" onClose={onClose}>
      <p className="text-muted">
        เลือกว่าบล็อกใหม่จะแสดงอะไร บล็อกจะถูกซ่อนไว้ก่อน เว็บจะได้ไม่แสดงบล็อกที่ยังทำไม่เสร็จ ในภาพร่าง
        กรอบเส้นประคือรูปที่ต้องอัปโหลด ส่วนเส้นคือข้อความที่ต้องพิมพ์
      </p>
      <div className="-mx-3 flex max-h-[65vh] flex-col gap-5 overflow-y-auto">
        {group("content", "ข้อความและรูปที่ต้องใส่เอง")}
        {group("data", "ดึงข้อมูลจากเว็บมาให้เอง")}
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
  const allowed = isAllowedImage(url);
  return (
    <Dialog title="Image" onClose={onClose}>
      <UploadButton to={uploadTo} onUploaded={onPick} />
      <form
        className="flex flex-col gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (allowed) onPick(url.trim());
        }}
      >
        <label htmlFor="image-dialog-url" className="font-bold">
          Or an image URL
        </label>
        <div className="flex gap-2">
          <input
            id="image-dialog-url"
            type="text"
            inputMode="url"
            value={url}
            aria-invalid={!allowed}
            aria-describedby={allowed ? undefined : "image-dialog-error"}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit" className="btn" disabled={!allowed || url.trim() === "" || url.trim() === current}>
            Use it
          </button>
        </div>
        {allowed ? null : <OffSiteImageError id="image-dialog-error" />}
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
