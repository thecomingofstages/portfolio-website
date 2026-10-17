import { Router } from "express";
import { JoinController } from "../controllers/join.controller";

export const joinRoute = Router();

joinRoute.get("/join", JoinController.list);
