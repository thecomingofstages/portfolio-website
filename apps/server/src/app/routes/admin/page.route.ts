import { Router } from "express";
import { blockRoutes, docRoutes } from "../../controllers/admin/crud.controller";
import { pageSpec } from "../../helpers/admin/specs.helper";

/** /api/admin/pages (by key) and its blocks. */
export const adminPageRoute = Router();

docRoutes(adminPageRoute, "/pages", pageSpec);
blockRoutes(adminPageRoute, "/pages/:id/blocks", pageSpec);
