/**
 * The admin API, mounted under /api/admin behind the Auth middleware (S5).
 * Every route here needs a valid admin token; Auth runs before any of them,
 * so an unknown /api/admin/* path is a 401 without a token, and a 404 with one.
 *
 * S6: one route file per domain goes here (project, track, apply, page).
 * S8: uploads.
 */
import { Router } from "express";

export function initAdminRoutes(): Router {
  const admin = Router();
  return admin;
}
