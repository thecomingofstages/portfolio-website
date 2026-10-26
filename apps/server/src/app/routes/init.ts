/**
 * Mounts every route file under /api (the paths in docs/API.md).
 * One file per domain: add it here when its task lands.
 */
import { Router } from "express";
import type { Config } from "../config/init";
import { Auth } from "../middleware/Auth";
import { initAdminRoutes } from "./admin/init";
import { docsRoute } from "./docs.route";
import { healthRoute } from "./health.route";
import { joinRoute } from "./join.route";
import { pageRoute } from "./page.route";
import { projectRoute } from "./project.route";
import { trackRoute } from "./track.route";

export function initRoutes(config: Config): Router {
  const api = Router();

  api.use(healthRoute);
  if (config.DOCS_ENABLED === "true") api.use(docsRoute);

  // Public, read-only (S3)
  api.use(pageRoute);
  api.use(projectRoute);
  api.use(trackRoute);
  api.use(joinRoute);

  // Admin (S5): every /api/admin/* path needs a valid token, even ones that do not exist.
  api.use("/admin", Auth, initAdminRoutes());

  return api;
}
