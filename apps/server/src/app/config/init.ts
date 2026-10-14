/**
 * Reads the Worker environment once and checks it with zod, so a missing or
 * wrong setting stops the server at start instead of failing on some request.
 */
import { z } from "zod";
import { appConfSchema } from "./app.conf";
import { appKeysSchema } from "./app.keys";
import { dbKeysSchema } from "./db.keys";

const envSchema = appConfSchema.merge(appKeysSchema).merge(dbKeysSchema);

export type Config = z.infer<typeof envSchema> & {
  /** R2 binding to the site media bucket (not a string, so not checked by zod). */
  MEDIA_BUCKET: R2Bucket;
};

export function initConfig(env: Record<string, unknown>): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    // Names and reasons only, never the values.
    const problems = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid environment:\n- ${problems.join("\n- ")}`);
  }
  if (!env.MEDIA_BUCKET) throw new Error("Invalid environment:\n- MEDIA_BUCKET: R2 binding is missing");
  return { ...parsed.data, MEDIA_BUCKET: env.MEDIA_BUCKET as R2Bucket };
}
