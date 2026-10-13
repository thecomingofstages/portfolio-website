/**
 * App secrets: set with `npx wrangler secret put <NAME>`, and in .dev.vars locally.
 * Never log these or put them in an error message.
 */
import { z } from "zod";

export const appKeysSchema = z.object({
  /** Signs and checks admin tokens (task S5). */
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  /** Sent with calls to the client's /api/revalidate (task S9). */
  REVALIDATE_SECRET: z.string().min(1, "REVALIDATE_SECRET is required"),
});
