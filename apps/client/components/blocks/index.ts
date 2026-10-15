import type { ComponentType } from "react";
import type { Block, BlockType } from "@/types/api";
import Article from "./Article";
import Gallery from "./Gallery";
import ImageBlock from "./ImageBlock";

/** The props every block component takes: its own filled-in block. */
export type BlockProps<T extends BlockType> = { block: Extract<Block, { type: T }> };

export type BlockComponents = { [T in BlockType]?: ComponentType<BlockProps<T>> };

/**
 * Block `type` → component, one component per file in this folder
 * (docs/FRONTEND.md "Components"). Add each component here when its task lands:
 *   hero: Hero, article: Article, image: ImageBlock, quote: Quote,
 *   gallery: Gallery, video: Video, button: ButtonBlock, stats: Stats,
 *   highlights: Highlights, team: Team, sponsors: Sponsors,
 *   projects: ProjectsBlock (sprint 1), join: Join (sprint 2),
 *   tracks: TrackCards, yearbook: YearbookCards (sprint 3).
 * A type with no entry renders nothing.
 */
export const blockComponents: BlockComponents = {
  article: Article,
  gallery: Gallery,
  image: ImageBlock,
};
