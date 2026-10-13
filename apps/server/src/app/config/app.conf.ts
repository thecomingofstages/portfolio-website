/** Non-secret app settings: Wrangler `vars` (docs/API.md "Environment"). */
import { z } from "zod";

export const appConfSchema = z.object({
  // TODO(R2 media bucket): public URL of the site media bucket; "<...>" until decided.
  MEDIA_BASE_URL: z.string(),
  REVALIDATE_URL: z.string(),
  /** Swagger UI and /api/openapi.yaml. "true" only for local dev. */
  DOCS_ENABLED: z.enum(["true", "false"]).default("false"),
});

/** Fixed settings that are not environment values. */
export const appConf = {
  /** Every route is mounted under this prefix (docs/API.md paths). */
  apiPrefix: "/api",
  /** JSON bodies only; uploads (S8) stream to R2 through their own route. */
  jsonLimit: "1mb",
} as const;
