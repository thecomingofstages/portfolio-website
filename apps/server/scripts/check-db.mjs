// Checks that MONGODB_URI connects, and lists the collections and their validators.
// Run from apps/server:  npm run check:db   (reads .dev.vars)
// Prints no connection details: the URI holds the password.
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Fill it in .dev.vars (see .dev.vars.example).");
  process.exit(1);
}

const expected = ["apply", "pages", "projects", "tracks"];
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

try {
  await client.connect();
  const db = client.db("tcos");
  await db.command({ ping: 1 });
  console.log("✓ connected to database tcos");

  const found = await db.listCollections().toArray();
  for (const name of expected) {
    const c = found.find((f) => f.name === name);
    if (!c) console.log(`✗ ${name}: missing (run tcos_schema.mongodb.js)`);
    else if (!c.options?.validator) console.log(`✗ ${name}: no validator (run tcos_schema.mongodb.js)`);
    else console.log(`✓ ${name}: validator ${c.options.validationLevel ?? "strict"}`);
  }
  process.exitCode = expected.every((n) => found.some((f) => f.name === n && f.options?.validator)) ? 0 : 1;
} catch (err) {
  console.error(`✗ cannot connect: ${err?.name}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
