/**
 * buildApp: the Express app, with no database connection and no listen().
 * index.ts runs it on Workers; tests run it as it is with a test config.
 */
import express from "express";
import { appConf } from "./config/app.conf";
import type { Config } from "./config/init";
import { ErrorHandler, NotFound } from "./middleware/ErrorHandler";
import { Security } from "./middleware/Security";
import { initRoutes } from "./routes/init";

export function buildApp(config: Config) {
  const app = express();
  app.locals.config = config;

  Security(app);
  app.use(appConf.apiPrefix, initRoutes(config));

  app.use(NotFound);
  app.use(ErrorHandler);
  return app;
}
