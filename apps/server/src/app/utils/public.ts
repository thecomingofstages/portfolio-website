/** Small helpers shared by the public controllers. */
import type { Request } from "express";
import { withDb } from "../database/db";
import type { Models } from "../models";
import { slug as slugSchema } from "../schemas/common.schema";
import { ApiError } from "./ApiError";
import { getConfig } from "./config";

/** Runs `fn` with a database connection for this request. */
export function query<T>(req: Request, fn: (m: Models) => Promise<T>): Promise<T> {
  return withDb(getConfig(req).MONGODB_URI, fn);
}

/** A URL key (slug or track key). One that cannot exist is a 404, the same as a missing one. */
export function urlKey(value: unknown): string {
  const parsed = slugSchema.safeParse(value);
  if (!parsed.success) throw ApiError.notFound();
  return parsed.data;
}

/** The value, or 404 when it is null (hidden or missing). */
export function found<T>(value: T | null): T {
  if (value === null) throw ApiError.notFound();
  return value;
}
