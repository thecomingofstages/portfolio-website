/** Controllers stay thin: read the request, call a helper, send the answer. */
import type { RequestHandler } from "express";
import { pingDatabase } from "../helpers/health.helper";
import { ApiError } from "../utils/ApiError";
import { getConfig } from "../utils/config";
import { Logger } from "../utils/Logger";

export const HealthController = {
  /** GET /api/health */
  check: (async (req, res) => {
    try {
      await pingDatabase(getConfig(req).MONGODB_URI);
    } catch (err) {
      Logger.error("Health check: database unreachable", err);
      throw ApiError.unavailable("Database unavailable");
    }
    res.json({ status: "ok", db: "ok" });
  }) satisfies RequestHandler,
};
