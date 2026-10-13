/**
 * Mounts every route file under /api (the paths in docs/API.md).
 * One file per domain: add it here when its task lands.
 */
import { Router } from "express";
import type { Config } from "../config/init";
import { docsRoute } from "./docs.route";
import { healthRoute } from "./health.route";

export function initRoutes(config: Config): Router {
  const api = Router();

  api.use(healthRoute);
  if (config.DOCS_ENABLED === "true") api.use(docsRoute);

  // S3: projectRoute, trackRoute, joinRoute, pageRoute (public)
  // S5/S6: api.use("/admin", Auth, adminRoutes)
  // S8: uploadRoute (under /admin)

  return api;
}
