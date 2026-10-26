import type { ReactNode } from "react";
import type { BlockType } from "@/types/admin";

/**
 * A small drawing of each block's layout for the "Add a block" list, so editors see where
 * pictures go (dashed frames with a picture mark) and where text goes (lines), before adding it.
 * Drawn with the editor's tokens only; it is a sketch, not the site's rendering.
 */

function Picture({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center rounded-[var(--radius-button)] border border-dashed border-muted ${className}`}>
      <PictureIcon />
    </span>
  );
}

const Line = ({ w = "w-full", strong = false }: { w?: string; strong?: boolean }) => (
  <span className={`block h-1 rounded-full ${strong ? "bg-foreground" : "bg-muted/60"} ${w}`} />
);
const Button = () => <span className="block h-2 w-6 rounded-[var(--radius-button)] bg-accent" />;
const Data = ({ children }: { children: ReactNode }) => (
  <span className="flex h-full w-full items-end gap-1 rounded-[var(--radius-button)] bg-background p-1.5">{children}</span>
);
const Bar = ({ h }: { h: string }) => <span className={`block w-full rounded-[1px] bg-muted/50 ${h}`} />;

const SKETCHES: Record<BlockType, ReactNode> = {
  hero: (
    <span className="relative flex h-full w-full">
      <Picture className="absolute inset-0" />
      <span className="relative flex w-3/5 flex-col justify-center gap-1 p-2">
        <Line strong />
        <Line w="w-2/3" />
        <Button />
      </span>
    </span>
  ),
  article: (
    <span className="grid h-full w-full grid-cols-2 gap-1.5">
      <span className="flex flex-col gap-1">
        <Line strong w="w-2/3" />
        <Line />
        <Line />
        <Line w="w-4/5" />
      </span>
      <Picture />
    </span>
  ),
  image: (
    <span className="flex h-full w-full flex-col gap-1">
      <Picture className="flex-1" />
      <Line w="w-1/2" />
    </span>
  ),
  quote: (
    // The dashed frame is the optional background picture.
    <span className="flex h-full w-full flex-col items-start justify-center gap-1 rounded-[var(--radius-button)] border border-dashed border-muted bg-background px-2">
      <Line strong />
      <Line strong w="w-3/4" />
      <Line w="w-1/3" />
    </span>
  ),
  gallery: (
    <span className="grid h-full w-full grid-cols-3 gap-1">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex flex-col gap-1">
          <Picture className="flex-1" />
          <Line />
        </span>
      ))}
    </span>
  ),
  video: (
    <span className="flex h-full w-full flex-col gap-1">
      <span className="flex flex-1 items-center justify-center rounded-[var(--radius-button)] bg-background">
        <PlayIcon />
      </span>
      <Line w="w-1/2" />
    </span>
  ),
  button: (
    <span className="flex h-full w-full items-center justify-center gap-1.5">
      <Button />
      <span className="block h-2 w-6 rounded-[var(--radius-button)] border border-accent" />
    </span>
  ),
  stats: (
    <span className="grid h-full w-full grid-cols-3 items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex flex-col items-center gap-1">
          <Line strong w="w-2/3" />
          <Line w="w-full" />
        </span>
      ))}
    </span>
  ),
  highlights: (
    <Data>
      <span className="flex w-full flex-col gap-1.5">
        <Bar h="h-2" />
        <Bar h="h-2" />
        <Bar h="h-2" />
      </span>
    </Data>
  ),
  team: (
    <Data>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="block size-3 rounded-full bg-muted/50" />
          <Bar h="h-1" />
        </span>
      ))}
    </Data>
  ),
  sponsors: (
    <Data>
      {[0, 1, 2].map((i) => (
        <Bar key={i} h="h-4" />
      ))}
    </Data>
  ),
  join: (
    <Data>
      <span className="flex w-full flex-col gap-1">
        <Bar h="h-5" />
        <span className="block h-1.5 w-5 rounded-[1px] bg-accent" />
      </span>
    </Data>
  ),
  projects: (
    <Data>
      {["h-6", "h-8", "h-10", "h-8", "h-6"].map((h, i) => (
        <Bar key={i} h={h} />
      ))}
    </Data>
  ),
  tracks: (
    <Data>
      {[0, 1, 2].map((i) => (
        <Bar key={i} h="h-8" />
      ))}
    </Data>
  ),
  yearbook: (
    <Data>
      <span className="grid w-full grid-cols-4 gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Bar key={i} h="h-3" />
        ))}
      </span>
    </Data>
  ),
};

export default function BlockSketch({ type }: { type: BlockType }) {
  return (
    <span aria-hidden className="flex h-16 w-28 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-border bg-card-bg p-1.5">
      {SKETCHES[type]}
    </span>
  );
}

/** What an editor fills in for each block: pictures to upload, and text to type. Data blocks fill themselves. */
export const FILL_IN: Record<BlockType, { upload?: string; type?: string; data?: string }> = {
  hero: { upload: "รูปหนึ่งรูป หรือหลายรูปถ้าทำเป็นสไลด์โชว์ (วิดีโอใส่เป็นลิงก์)", type: "ชื่อ คำโปรย และข้อความบนปุ่ม" },
  article: { upload: "รูปหนึ่งรูป จะใส่หรือไม่ใส่ก็ได้", type: "หัวข้อและเนื้อหา" },
  image: { upload: "รูปหนึ่งรูป", type: "คำบรรยายใต้รูปและเครดิต" },
  quote: { upload: "รูปพื้นหลัง จะใส่หรือไม่ใส่ก็ได้", type: "คำพูด ชื่อคนพูด และตำแหน่งของเขา" },
  gallery: { upload: "หลายรูป", type: "คำอธิบายของแต่ละรูป" },
  video: { type: "ลิงก์วิดีโอ (YouTube, TikTok, Instagram, Drive) ชื่อตอน และคำบรรยาย" },
  button: { type: "ข้อความบนปุ่ม และลิงก์ที่ปุ่มพาไป" },
  stats: { type: "ตัวเลข และบอกว่านับอะไร" },
  highlights: { data: "ดึงมาจากไฮไลต์ของโปรเจกต์ให้เอง" },
  team: { data: "ดึงมาจากรายชื่อทีมให้เอง" },
  sponsors: { data: "ดึงมาจากรายชื่อสปอนเซอร์ให้เอง" },
  join: { data: "ดึงรอบรับสมัครที่เปิดอยู่ตอนนี้มาให้เอง" },
  projects: { data: "ดึงโปรเจกต์ที่แสดงอยู่มาให้เอง" },
  tracks: { data: "ดึงสายงานที่แสดงอยู่มาให้เอง" },
  yearbook: { data: "ดึงโปรเจกต์ที่มีหนังสือรุ่นมาให้เอง" },
};

export function PictureIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-muted">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1" />
      <circle cx="5.5" cy="6.5" r="1.25" />
      <path d="M2 12l4-4 3 3 2-2 3 3" />
    </svg>
  );
}

export function TextIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-muted">
      <path d="M3 4h10M8 4v9M5.5 13h5" />
    </svg>
  );
}

export function DataIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-muted">
      <path d="M2.5 8a5.5 5.5 0 0 1 9.5-3.8M13.5 8A5.5 5.5 0 0 1 4 11.8M12 1.5v3h-3M4 14.5v-3h3" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" className="text-muted">
      <path d="M5 3.5v9l7-4.5z" />
    </svg>
  );
}
