import { z } from "zod";
import type { BlocksTarget } from "@/types/admin";

/**
 * Messages from the client's edit mode (apps/client/components/edit/draft.ts), checked
 * before the editor acts on one. The page runs on another origin, so nothing it sends is trusted.
 */
const index = z.number().int().min(0);
const msg = <T extends string, S extends z.ZodRawShape>(type: T, shape: S) =>
  z.object({ tcos: z.literal("edit"), type: z.literal(type), ...shape });

export const canvasMessageSchema = z.discriminatedUnion("type", [
  msg("ready", {}),
  msg("select", { index }),
  msg("edit", { index, path: z.string().max(100), value: z.string().max(100_000) }),
  msg("image", { index, path: z.string().max(100) }),
  msg("fields", { index }),
  msg("move", { index, to: index }),
  msg("remove", { index }),
  msg("insert", { at: index }),
]);

export type CanvasMessage = z.infer<typeof canvasMessageSchema>;

/** The client's edit mode for a page or project, or null when SITE_URL is not set. */
export function canvasUrl(siteUrl: string | undefined, target: BlocksTarget): string | null {
  if (!siteUrl) return null;
  const base = siteUrl.replace(/\/+$/, "");
  return target.kind === "page"
    ? `${base}/edit?page=${encodeURIComponent(target.key)}`
    : `${base}/edit?project=${encodeURIComponent(target.slug)}`;
}

/** True only for a message from the framed page itself: its origin and its window. */
export function isFromPage(event: Pick<MessageEvent, "origin" | "source">, siteOrigin: string, page: Window | null | undefined) {
  return event.origin === siteOrigin && !!page && event.source === page;
}
