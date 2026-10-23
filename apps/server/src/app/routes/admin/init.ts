/**
 * The admin API, mounted under /api/admin behind the Auth middleware (S5).
 * Every route here needs a valid admin token; Auth runs before any of them,
 * so an unknown /api/admin/* path is a 401 without a token, and a 404 with one.
 *
 * S6/S7: projects, tracks, apply rounds and pages, with the write checks.
 * S8: uploads.
 */
import { Router } from "express";
import { adminApplyRoute } from "./apply.route";
import { adminPageRoute } from "./page.route";
import { adminProjectRoute } from "./project.route";
import { adminTrackRoute } from "./track.route";

export function initAdminRoutes(): Router {
  const admin = Router();
  admin.use(adminProjectRoute);
  admin.use(adminTrackRoute);
  admin.use(adminApplyRoute);
  admin.use(adminPageRoute);
  return admin;
}
