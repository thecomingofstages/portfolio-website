/** S5: every /api/admin/* route needs a valid admin JWT, else 401. */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SignJWT } from "jose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { verifyAdminToken } from "../src/app/utils/JWT";
import { buildTestApp, testConfig } from "./helpers/app";

const SECRET = testConfig().JWT_SECRET;
const key = (s: string) => new TextEncoder().encode(s);
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");

function token({ secret = SECRET, alg = "HS256", exp }: { secret?: string; alg?: string; exp?: number | string } = {}) {
  let jwt = new SignJWT({}).setProtectedHeader({ alg }).setSubject("tester").setIssuedAt();
  if (exp !== undefined) jwt = jwt.setExpirationTime(exp);
  return jwt.sign(key(secret));
}

/** An admin path that does not exist: a request that passes Auth is a 404, with no database needed. */
const admin = (auth?: string) => {
  const req = request(buildTestApp()).get("/api/admin/no-such-route");
  return auth === undefined ? req : req.set("Authorization", auth);
};

function expect401(res: request.Response) {
  expect(res.status).toBe(401);
  expect(res.body).toEqual({ error: "Unauthorized" }); // the same answer for every failure
  expect(res.headers["www-authenticate"]).toBe('Bearer realm="admin"');
}

describe("rejected with 401", () => {
  it("no Authorization header", async () => expect401(await admin()));
  it("not a Bearer token", async () => expect401(await admin(`Basic ${Buffer.from("a:b").toString("base64")}`)));
  it("a Bearer value that is not a JWT", async () => expect401(await admin("Bearer not-a-jwt")));
  it("signed with another secret", async () => expect401(await admin(`Bearer ${await token({ secret: "another-secret-another-secret-123" })}`)));
  it("expired", async () => expect401(await admin(`Bearer ${await token({ exp: Math.floor(Date.now() / 1000) - 60 })}`)));
  it("signed with another algorithm (HS512)", async () => expect401(await admin(`Bearer ${await token({ alg: "HS512" })}`)));

  it("unsigned (alg: none)", async () => {
    const unsigned = `${b64({ alg: "none", typ: "JWT" })}.${b64({ sub: "tester" })}.x`;
    expect401(await admin(`Bearer ${unsigned}`));
  });

  it("a valid token whose payload was changed", async () => {
    const [h, , s] = (await token()).split(".");
    expect401(await admin(`Bearer ${h}.${b64({ sub: "someone-else" })}.${s}`));
  });

  it("unknown admin paths too, so the admin API's routes cannot be probed", async () => {
    expect401(await request(buildTestApp()).post("/api/admin/does-not-exist").send({}));
  });
});

describe("accepted", () => {
  it("a valid token without exp (TODO(token expiry))", async () => {
    const res = await admin(`Bearer ${await token()}`);
    expect(res.status).toBe(404); // past Auth
  });

  it("a valid token that has not expired", async () => {
    expect((await admin(`Bearer ${await token({ exp: "1h" })}`)).status).toBe(404);
  });

  it("does not affect the public API", async () => {
    expect((await request(buildTestApp()).get("/api/does-not-exist")).status).toBe(404);
  });
});

describe("scripts/make-token.mjs", () => {
  const script = fileURLToPath(new URL("../scripts/make-token.mjs", import.meta.url));
  const run = (...args: string[]) =>
    execFileSync(process.execPath, [script, ...args], { env: { ...process.env, JWT_SECRET: SECRET }, encoding: "utf8" }).trim();

  it("makes a token the server accepts, naming who it is for", async () => {
    const payload = await verifyAdminToken(run("--for", "tester"), SECRET);
    expect(payload.sub).toBe("tester");
    expect(payload.exp).toBeUndefined();
  });

  it("adds an expiry with --expires", async () => {
    const payload = await verifyAdminToken(run("--for", "tester", "--expires", "2h"), SECRET);
    expect(payload.exp! - payload.iat!).toBe(2 * 3600);
  });

  it("refuses without --for", () => {
    expect(() => run()).toThrow();
  });
});
