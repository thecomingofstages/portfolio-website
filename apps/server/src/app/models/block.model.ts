/**
 * block_component in tcos_schema.mongodb.js. Kept loose until S4 fills data blocks in:
 * each block has these common fields plus its own, which the database validator checks.
 */
export type BlockType =
  | "hero" | "article" | "image" | "quote" | "gallery" | "video" | "button" | "stats"
  | "projects" | "tracks" | "yearbook" | "join" | "team" | "sponsors" | "highlights";

export type Block = {
  id: string;
  type: BlockType | (string & {});
  title?: string | null;
  is_shown: boolean;
  [field: string]: unknown;
};
