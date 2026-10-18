import { Router } from "express";
import { ProjectController } from "../controllers/project.controller";

export const projectRoute = Router();

projectRoute.get("/projects", ProjectController.list);
projectRoute.get("/projects/:slug", ProjectController.get);
projectRoute.get("/projects/:slug/yearbook", ProjectController.yearbook);
