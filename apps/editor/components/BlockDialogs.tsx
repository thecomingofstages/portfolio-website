"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import BlockSketch from "@/components/BlockSketch";
import type { UploadOwner } from "@/lib/admin-api";
import { blockInfo, ON_SITE } from "@/lib/blocks";
import { driveFileId, IMAGE_TYPES, isMediaUrl, OFF_SITE_IMAGE, VIDEO_TYPES } from "@/lib/media";
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

/** Sends a file (multipart) or a Drive link (JSON) to the editor's /api/upload; answers the new URL or an error. */
async function upload(to: UploadOwner, body: FormData | { url: string }): Promise<{ url: string } | { error: string }> {
  const isFile = body instanceof FormData;
  try {
    const response = await fetch(`/api/upload?collection=${to.collection}&owner=${encodeURIComponent(to.owner)}`, {
      method: "POST",
      headers: isFile ? undefined : { "content-type": "application/json" },
      body: isFile ? body : JSON.stringify(body),
    });
    const answer = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!response.ok || !answer.url) return { error: answer.error ?? `The upload failed (${response.status}).` };
    return { url: answer.url };
  } catch {
    return { error: "The upload did not reach the editor. Check the connection and try again." };
  }
}

/**
 * Picks one picture (or, with `video`, a video): a file to upload, or a link. A Google Drive
 * share link is copied into the media bucket first; a media bucket link is used as it is.
 * Other links are refused: the site shows media only from the bucket. Where the field allows,
 * "No image" empties it.
 */
export function MediaDialog({
  current,
  uploadTo,
  video = false,
  canRemove,
  onPick,
  onClose,
}: {
  current: string;
  /** Where uploads are filed; without it (not saved yet), only media bucket links work. */
  uploadTo?: UploadOwner;
  video?: boolean;
  canRemove: boolean;
  onPick: (url: string | null) => void;
  onClose: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [link, setLink] = useState("");
  const [state, setState] = useState<{ busy: true } | { error: string } | null>(null);
  const busy = state !== null && "busy" in state;
  const kind = video ? "picture or video" : "picture";

  async function send(body: FormData | { url: string }) {
    if (!uploadTo) return;
    setState({ busy: true });
    const answer = await upload(uploadTo, body);
    if ("error" in answer) setState(answer);
    else onPick(answer.url);
  }

  function submitLink() {
    const url = link.trim();
    if (isMediaUrl(url)) onPick(url);
    else if (driveFileId(url) && uploadTo) void send({ url });
    else setState({ error: uploadTo ? OFF_SITE_IMAGE : "Save first: a new page or project takes files and Drive links once it is saved." });
  }

  return (
    <Dialog title={video ? "Picture or video" : "Picture"} onClose={onClose}>
      {current ? <MediaPreview url={current} /> : null}
      <div className="flex flex-col gap-1">
        <span className="font-bold">Upload a file</span>
        <div>
          <button type="button" className="btn btn-primary" disabled={busy || !uploadTo} onClick={() => input.current?.click()}>
            {busy ? "Uploading…" : `Choose a ${kind}`}
          </button>
        </div>
        {uploadTo ? null : <span className="text-muted">Save first: uploads open once this is saved.</span>}
        <input
          ref={input}
          type="file"
          accept={video ? `${IMAGE_TYPES},${VIDEO_TYPES}` : IMAGE_TYPES}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const body = new FormData();
            body.append("file", file);
            void send(body);
          }}
        />
      </div>
      {/* Not a <form>: the dialog can open inside a document's form, and forms cannot nest. */}
      <div className="flex flex-col gap-1">
        <label htmlFor="media-dialog-link" className="flex flex-col">
          <span className="font-bold">Or a link</span>
          <span className="text-muted">A Google Drive share link (shared with anyone with the link), or a link from the media bucket</span>
        </label>
        <div className="flex gap-2">
          <input
            id="media-dialog-link"
            type="url"
            inputMode="url"
            value={link}
            aria-invalid={state !== null && "error" in state}
            aria-describedby={state !== null && "error" in state ? "media-dialog-error" : undefined}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              e.preventDefault();
              if (!busy && link.trim() !== "") submitLink();
            }}
          />
          <button type="button" className="btn" disabled={busy || link.trim() === ""} onClick={submitLink}>
            Use it
          </button>
        </div>
      </div>
      {state && "error" in state ? (
        <p id="media-dialog-error" role="alert" className="text-red">
          {state.error}
        </p>
      ) : null}
      {canRemove && current ? (
        <div>
          <button type="button" className="btn" disabled={busy} onClick={() => onPick(null)}>
            No {kind}
          </button>
        </div>
      ) : null}
    </Dialog>
  );
}

/** A small view of a media URL: the picture, the video, or the text when it is not a link (`<...>`). */
export function MediaPreview({ url }: { url: string }) {
  if (!/^https?:\/\//i.test(url)) return <span className="text-muted">{url}</span>;
  const box = "h-20 w-32 shrink-0 rounded-[var(--radius-button)] border border-border bg-background object-cover";
  if (/\.(mp4|webm)$/i.test(url)) return <video src={url} className={box} muted playsInline preload="metadata" aria-label="Video" />;
  // eslint-disable-next-line @next/next/no-img-element -- a thumbnail from the bucket; next/image would need its host configured
  return <img src={url} alt="" className={box} />;
}
