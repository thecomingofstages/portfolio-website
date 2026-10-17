import { Router } from "express";
import { TrackController } from "../controllers/track.controller";

export const trackRoute = Router();

trackRoute.get("/tracks", TrackController.list);
trackRoute.get("/tracks/:key", TrackController.get);
