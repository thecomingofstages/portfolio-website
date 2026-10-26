import { Router } from "express";
import { blockRoutes, docRoutes, itemRoutes } from "../../controllers/admin/crud.controller";
import { highlightItemSpec, projectSpec, sponsorItemSpec, teamSpec } from "../../helpers/admin/specs.helper";

/** /api/admin/projects (by slug), its team, sponsors, highlights (by item _id) and blocks. */
export const adminProjectRoute = Router();

docRoutes(adminProjectRoute, "/projects", projectSpec);
itemRoutes(adminProjectRoute, "/projects/:id/team", teamSpec);
itemRoutes(adminProjectRoute, "/projects/:id/sponsors", sponsorItemSpec);
itemRoutes(adminProjectRoute, "/projects/:id/highlights", highlightItemSpec);
blockRoutes(adminProjectRoute, "/projects/:id/blocks", projectSpec);
