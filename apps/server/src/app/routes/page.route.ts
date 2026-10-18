import { Router } from "express";
import { PageController } from "../controllers/page.controller";

export const pageRoute = Router();

pageRoute.get("/pages/home", PageController.home);
