/** pages (Home now) (tcos_schema.mongodb.js). `updated_at` is set by the server on every write. */
import { z } from "zod";
import { blocksSchema } from "./block.schema";
import { bool, str, urlKey } from "./fields.schema";

export const pageSchema = z.object({ key: urlKey, title: str, blocks: blocksSchema, is_shown: bool }).strict();
