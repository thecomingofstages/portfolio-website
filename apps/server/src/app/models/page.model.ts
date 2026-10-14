/** `pages` collection (pages that are not a project, Home now), as in tcos_schema.mongodb.js. */
import type { ObjectId } from "mongodb";
import type { Block } from "./block.model";

export const PAGES = "pages";

export type PageDoc = {
  _id?: ObjectId;
  key: string;
  title: string;
  blocks: Block[];
  is_shown: boolean;
  /** No hooks: set with `$set: { updated_at: new Date() }` on every page write. */
  updated_at?: Date;
};
