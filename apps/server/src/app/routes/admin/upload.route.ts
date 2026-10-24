import { Router } from "express";
import { UploadController } from "../../controllers/admin/upload.controller";

/** /api/admin/uploads: one file in (multipart), one file out (by key). */
export const adminUploadRoute = Router();

adminUploadRoute.post("/uploads", UploadController.create);
// Keys contain slashes (projects/<slug>/<id>.webp): match the rest of the path.
adminUploadRoute.delete("/uploads/*key", UploadController.remove);
