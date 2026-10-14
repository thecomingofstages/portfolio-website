/** Fixed database settings (not secret). */
export const dbConf = {
  name: "tcos",
  /** One request, one connection: no pool to keep warm on Workers. */
  maxPoolSize: 1,
  serverSelectionTimeoutMS: 5000,
} as const;
