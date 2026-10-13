/**
 * The only database helper (shared: ask its owner before changing it).
 * Official `mongodb` driver, not Mongoose (docs/API.md "Hosting", "Database access").
 *
 * Workers keep nothing between requests, so there is no singleton: each request
 * opens its own client through `withDb` and closes it when done.
 */
import { MongoClient, ObjectId } from "mongodb";
import { dbConf } from "../config/db.conf";
import { initModels, type Models } from "../models";
import { ApiError } from "../utils/ApiError";

/**
 * Opens a connection, runs `fn` with the collection handles, and always closes it.
 *
 *   const list = await withDb(config.MONGODB_URI, (m) => m.projects.find({ is_shown: true }).toArray());
 */
export async function withDb<T>(uri: string, fn: (m: Models) => Promise<T>): Promise<T> {
  const client = new MongoClient(uri, {
    maxPoolSize: dbConf.maxPoolSize,
    serverSelectionTimeoutMS: dbConf.serverSelectionTimeoutMS,
  });
  try {
    await client.connect();
    return await fn(initModels(client.db(dbConf.name)));
  } finally {
    await client.close();
  }
}

/** Turns a string from the URL into an ObjectId. Answers 400 when it is not one. */
export function toObjectId(id: string): ObjectId {
  if (typeof id !== "string" || !/^[0-9a-f]{24}$/i.test(id)) {
    throw ApiError.badRequest("Invalid id");
  }
  return new ObjectId(id);
}

/** Adds `_id` to a new list item; every `$push` uses this. */
export function withId<T extends object>(item: T): T & { _id: ObjectId } {
  return { ...item, _id: new ObjectId() };
}
