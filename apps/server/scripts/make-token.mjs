// Makes an admin token by hand (task S5, docs/API.md "Auth"). There is no login endpoint.
//
//   npm run token -- --for <who>                one token for one person or tool
//   npm run token -- --for <who> --expires 30d  with an expiry (e.g. 2h, 7d, 30d)
//
// Signs with JWT_SECRET from .dev.vars (local). For the deployed server, run with the
// production secret instead:  JWT_SECRET=<secret> node scripts/make-token.mjs --for <who>
//
// TODO(token expiry): no expiry unless --expires is given, until the lead decides.
// Prints only the token. Never paste it into shared files or chat.
// To revoke every token, change JWT_SECRET.
import { SignJWT } from "jose";

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};

const secret = process.env.JWT_SECRET;
const who = arg("for");
const expires = arg("expires");

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

if (!secret || secret.length < 32) fail("JWT_SECRET must be set and at least 32 characters (see .dev.vars.example).");
if (!who || !/^[\w.@-]{1,64}$/.test(who)) fail("Say who the token is for: --for <name> (letters, digits, . _ @ -).");
if (expires !== undefined && !/^\d+[smhdw]$/.test(expires)) fail("--expires takes a number and a unit, e.g. 2h, 7d, 30d.");

let jwt = new SignJWT({}).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setSubject(who).setIssuedAt();
if (expires) jwt = jwt.setExpirationTime(expires);

console.log(await jwt.sign(new TextEncoder().encode(secret)));
