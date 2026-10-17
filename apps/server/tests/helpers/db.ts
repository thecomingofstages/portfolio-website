/**
 * A throwaway MongoDB in memory (mongodb-memory-server), so tests run the real
 * queries without Atlas. Use it once per test file:
 *
 *   const db = useTestDb();
 *   it("...", async () => { await db.models.projects.insertOne(makeProject()); ... request(db.app()) ... });
 */
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { dbConf } from "../../src/app/config/db.conf";
import { initModels, type Models } from "../../src/app/models";
import { buildTestApp } from "./app";

export function useTestDb() {
  let server: MongoMemoryServer;
  let client: MongoClient;
  const ctx = {
    models: undefined as unknown as Models,
    /** The app, pointed at this database. */
    app: () => buildTestApp({ MONGODB_URI: server.getUri() }),
  };

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    client = await MongoClient.connect(server.getUri());
    ctx.models = initModels(client.db(dbConf.name));
  }, 120_000); // the first run downloads a MongoDB binary

  beforeEach(async () => {
    await ctx.models.db.dropDatabase();
  });

  afterAll(async () => {
    await client?.close();
    await server?.stop();
  });

  return ctx;
}
