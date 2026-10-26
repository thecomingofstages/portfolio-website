import type { z } from "zod";
import type { blockSchema, BlockType, newProjectSchema, pageFieldsSchema, projectFieldsSchema } from "@/lib/schemas";

/**
 * Admin API documents as the editor reads them: as stored, sent as JSON
 * (`_id` as a hex string, dates as ISO 8601 strings). API.md does not give the
 * admin response shapes yet: TODO(admin response shapes).
 */

export type { BlockType };

/** One stored block, `is_shown` included. */
export type Block = z.infer<typeof blockSchema>;
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;

export type PageFields = z.infer<typeof pageFieldsSchema>;
export type ProjectFields = z.infer<typeof projectFieldsSchema>;
export type NewProject = z.infer<typeof newProjectSchema>;

/** `pages` (docs/DATABASE.md). */
export type PageDoc = {
  _id?: string;
  key: string;
  title: string;
  blocks: Block[];
  updated_at?: string;
  is_shown: boolean;
};

/**
 * `projects` (docs/DATABASE.md). The editor changes only the fields in
 * ProjectFields and `blocks`; team, sponsors and highlights are read but not
 * edited here (docs/EDITOR.md "Not in the editor yet").
 */
export type ProjectDoc = {
  _id?: string;
  slug: string;
  name: string;
  /** One of PROJECT_TYPES; a fixture may hold "<...>" until it is decided. */
  type: string;
  /** One of PROJECT_STATUSES, or "<...>" as for `type`. */
  status: string;
  /** ISO 8601, or "<...>" in a fixture */
  start_date: string;
  end_date?: string | null;
  venue?: string | null;
  summary?: string;
  org_chart_image?: string | null;
  pics?: string[];
  team?: { _id: string; is_shown: boolean }[];
  sponsors?: { _id: string; is_shown: boolean }[];
  highlights?: { _id: string; is_shown: boolean }[];
  blocks?: Block[];
  is_yearbook_shown?: boolean;
  is_shown: boolean;
};

/** `tracks` (docs/DATABASE.md), as the admin API sends it. */
export type TrackDoc = {
  _id?: string;
  key: string;
  display_name: string;
  desc?: string;
  pics?: string[];
  achievements?: Record<string, unknown>[];
  order?: number;
  is_shown: boolean;
};

/** `apply`, one recruitment round (docs/DATABASE.md), as the admin API sends it. */
export type RoundDoc = {
  _id: string;
  project_slug?: string | null;
  title: string;
  /** ISO 8601, or "<...>" in a fixture */
  opens_at: string;
  closes_at: string;
  extended_to?: string | null;
  qualifications?: Record<string, unknown>;
  positions: Record<string, unknown>[];
  timeline?: Record<string, unknown>[];
  apply_url?: string | null;
  poster?: string | null;
  is_shown: boolean;
};

/** Where a `blocks` array lives. */
export type BlocksTarget = { kind: "page"; key: string } | { kind: "project"; slug: string };

/** What a server action answers. */
export type ActionResult = { ok: true; message?: string } | { ok: false; errors: string[] };
