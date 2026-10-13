import type { Request } from "express";
import type { Config } from "../config/init";

/** The checked config, set on app.locals by buildApp. */
export function getConfig(req: Request): Config {
  return req.app.locals.config as Config;
}
