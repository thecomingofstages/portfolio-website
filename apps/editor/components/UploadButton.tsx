"use client";

import { useRef, useState } from "react";
import type { UploadOwner } from "@/lib/admin-api";

/** The image types the server accepts (apps/server upload.helper.ts). */
const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,image/avif";

/**
 * Uploads one image through the editor's /api/upload route, then hands its URL to
 * `onUploaded`. The file is filed under the page or project it belongs to.
 */
export default function UploadButton({
  to,
  onUploaded,
  label = "Upload image",
}: {
  to: UploadOwner;
  onUploaded: (url: string) => void;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ busy: true } | { error: string } | null>(null);

  async function send(file: File) {
    setState({ busy: true });
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(`/api/upload?collection=${to.collection}&owner=${encodeURIComponent(to.owner)}`, {
        method: "POST",
        body,
      });
      const answer = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !answer.url) {
        setState({ error: answer.error ?? `The upload failed (${response.status}).` });
        return;
      }
      setState(null);
      onUploaded(answer.url);
    } catch {
      setState({ error: "The upload did not reach the editor. Check the connection and try again." });
    }
  }

  const busy = state !== null && "busy" in state;
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button type="button" className="btn" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? "Uploading…" : label}
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void send(file);
        }}
      />
      {state && "error" in state ? (
        <span role="alert" className="text-red">
          {state.error}
        </span>
      ) : null}
    </span>
  );
}
