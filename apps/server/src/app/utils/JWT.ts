/**
 * Admin tokens (task S5, docs/API.md "Auth"): JWTs signed with JWT_SECRET, checked with jose.
 * There is no login endpoint: tokens are made by hand (scripts/make-token.mjs).
 * To revoke every token, change JWT_SECRET.
 */
import { jwtVerify, type JWTPayload } from "jose";

/** The only algorithm accepted: blocks `alg: none` and algorithm-swap tokens. */
export const JWT_ALG = "HS256";

const key = (secret: string) => new TextEncoder().encode(secret);

/**
 * The token's claims when it is valid: signed with `secret` using HS256, and not
 * expired if it has an `exp`. Throws otherwise (the caller answers 401).
 * TODO(token expiry): tokens without `exp` are accepted until the lead decides.
 */
export async function verifyAdminToken(token: string, secret: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, key(secret), { algorithms: [JWT_ALG] });
  return payload;
}
