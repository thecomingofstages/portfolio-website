/** Mounted only when DOCS_ENABLED is "true" (local dev); production leaves it off. */
import { Router } from "express";
import { DocsController } from "../controllers/docs.controller";

export const docsRoute = Router();

docsRoute.get("/docs", DocsController.page);
docsRoute.get("/docs/init.js", DocsController.init);
docsRoute.get("/openapi.yaml", DocsController.spec);
