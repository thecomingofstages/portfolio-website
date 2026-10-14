/** Business logic lives in helpers; controllers only translate HTTP. */
import { withDb } from "../database/db";

/** Pings MongoDB. Throws when it cannot be reached. */
export async function pingDatabase(uri: string): Promise<void> {
  await withDb(uri, (m) => m.db.command({ ping: 1 }));
}
