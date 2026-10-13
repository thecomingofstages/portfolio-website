/**
 * Security defaults for every response:
 * - helmet's headers (CSP, HSTS, nosniff, frame denial ...), `x-powered-by` off.
 * - No CORS headers: only the Next.js server calls this API, never a browser.
 * - JSON bodies only, size-limited.
 *
 * Rate limiting is not done here: Workers keep no memory between requests, so an
 * in-memory limiter would not work. Use Cloudflare's rate limiting rules (S10).
 */
import express, { type Express } from "express";
import helmet from "helmet";
import { appConf } from "../config/app.conf";

export function Security(app: Express) {
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: appConf.jsonLimit }));
}
