import { Router } from "express";
import { docRoutes, itemRoutes } from "../../controllers/admin/crud.controller";
import { achievementItemSpec, trackSpec } from "../../helpers/admin/specs.helper";

/** /api/admin/tracks (by key) and its achievements (by item _id). */
export const adminTrackRoute = Router();

docRoutes(adminTrackRoute, "/tracks", trackSpec);
itemRoutes(adminTrackRoute, "/tracks/:id/achievements", achievementItemSpec);
