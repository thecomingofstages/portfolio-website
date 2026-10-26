/**
 * A throwaway MongoDB in memory (mongodb-memory-server), so tests run the real
 * queries without Atlas. Use it once per test file:
 *
 *   const db = useTestDb();
 *   it("...", async () => { await db.models.projects.insertOne(makeProject()); ... request(db.app()) ... });
 *
 * `useTestDb({ schema: true })` also applies tcos_schema.mongodb.js (validators and
 * unique indexes) before each test, as on Atlas.
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { dbConf } from "../../src/app/config/db.conf";
import type { Config } from "../../src/app/config/init";
import { initModels, type Models } from "../../src/app/models";
import { buildTestApp } from "./app";
import { applySchema } from "./schema";

export function useTestDb(options: { schema?: boolean } = {}) {
  let server: MongoMemoryServer;
  let client: MongoClient;
  const ctx = {
    models: undefined as unknown as Models,
    /** The app, pointed at this database. */
    app: (overrides: Partial<Config> = {}) => buildTestApp({ MONGODB_URI: server.getUri(), ...overrides }),
  };

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    client = await MongoClient.connect(server.getUri());
    ctx.models = initModels(client.db(dbConf.name));
  }, 120_000); // the first run downloads a MongoDB binary

  beforeEach(async () => {
    await ctx.models.db.dropDatabase();
    if (options.schema) await applySchema(ctx.models.db);
  });

  afterAll(async () => {
    await client?.close();
    await server?.stop();
  });

  return ctx;
}
