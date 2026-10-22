import { Router } from "express";
import { docRoutes, itemRoutes } from "../../controllers/admin/crud.controller";
import { applySpec, positionItemSpec, timelineItemSpec } from "../../helpers/admin/specs.helper";

/** /api/admin/apply (by _id), its positions and timeline (by item _id). */
export const adminApplyRoute = Router();

docRoutes(adminApplyRoute, "/apply", applySpec);
itemRoutes(adminApplyRoute, "/apply/:id/positions", positionItemSpec);
itemRoutes(adminApplyRoute, "/apply/:id/timeline", timelineItemSpec);
