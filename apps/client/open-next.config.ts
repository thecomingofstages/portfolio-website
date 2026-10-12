import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// TODO(page cache): add an incremental cache (R2) and a tag cache here, so
// revalidatePath and timed revalidation work on Workers.
// See https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig({});
