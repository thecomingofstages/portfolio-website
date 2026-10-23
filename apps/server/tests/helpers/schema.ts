/**
 * Applies tcos_schema.mongodb.js (collections, $jsonSchema validators, indexes) to a
 * test database, without mongosh: the script's `db` calls are recorded, then replayed
 * with the driver. Admin tests use it so the zod schemas and the database validator
 * cannot drift apart unnoticed.
 */
import { readFileSync } from "node:fs";
import vm from "node:vm";
import type { CreateCollectionOptions, CreateIndexesOptions, Db, Document, IndexSpecification } from "mongodb";

const SCHEMA = readFileSync(new URL("../../../../tcos_schema.mongodb.js", import.meta.url), "utf8");

type Op =
  | ["create", string, CreateCollectionOptions]
  | ["command", Document]
  | ["index", string, IndexSpecification, CreateIndexesOptions | undefined];

export async function applySchema(db: Db) {
  const ops: Op[] = [];
  const shell = {
    getCollectionNames: () => [] as string[],
    createCollection: (name: string, opts: CreateCollectionOptions) => ops.push(["create", name, opts]),
    runCommand: (cmd: Document) => ops.push(["command", cmd]),
    getCollection: (name: string) => ({
      createIndex: (keys: IndexSpecification, opts?: CreateIndexesOptions) => ops.push(["index", name, keys, opts]),
    }),
  };
  vm.runInNewContext(SCHEMA, { db: shell, print: () => {} });

  for (const op of ops) {
    if (op[0] === "create") await db.createCollection(op[1], op[2]);
    else if (op[0] === "command") await db.command(op[1]);
    else await db.collection(op[1]).createIndex(op[2], op[3] ?? {});
  }
}
